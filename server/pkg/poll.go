package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/types/known/timestamppb"

	v1 "github.com/Khan/hackathon-khanmigogo/server/poll/v1"
	pb "github.com/Khan/hackathon-khanmigogo/server/poll/v1/v1connect"
)

type PollServer struct {
	pb.UnimplementedPollServiceHandler
	Rooms map[string]*Room
	mu    sync.RWMutex
}

func (ps *PollServer) GameRoomCreateRequest(
	ctx context.Context,
	req *connect.Request[v1.GameRoomCreateEventMessage],
	stream *connect.ServerStream[v1.GameRoomCreateResponse],
) error {
	fmt.Println("Got GameRoomCreateRequest", jsonify(req.Msg))

	// TODO(steve): Randomly generate but avoid collisions
	roomCode := IntToLetters(getRandRoomNumber())
	cancellableCtx, cancelFn := context.WithCancel(ctx)

	fmt.Println("RoomCode", roomCode)
	// check if room is already occupied
	for {
		if _, ok := ps.Rooms[roomCode]; !ok {
			fmt.Println("Room Code not already in use so ok to use", roomCode)
			// whew, we found one not in use
			// let's get out of here
			break
		}
		// well, let's try another
		roomCode = IntToLetters(getRandRoomNumber())
		// loop around again
	}

	session := &HostSession{
		Stream: stream,
		CommonSession: CommonSession{
			RoomCode: roomCode,
			Game:     req.Msg.Game,
			IsHost:   true,
			IsActive: true,
			errChan:  make(chan error),
		},
	}

	ps.mu.Lock()
	if ps.Rooms == nil {
		ps.Rooms = make(map[string]*Room)
	}

	// ps locked, but no need to lock room, as it is unshared at this point
	ps.Rooms[roomCode] = &Room{
		Status: &v1.UpdateResultsMessage{
			RoomCode:            roomCode,
			Game:                req.Msg.Game,
			QuestionsAndAnswers: req.Msg.QuestionsAndAnswers,
			VotingClosed:        false,
			VotingStarted:       false,
			TimedDuration:       req.Msg.TimedDuration,
			DurationRemaining:   req.Msg.TimedDuration,
		},
		Cancel:   cancelFn,
		Sessions: []StreamSender{session},
	}
	ps.mu.Unlock()
	log.Printf("Sending initial message to Host from %v\n", roomCode)
	room := ps.Rooms[roomCode]
	hasActive := room.UpdateAllSessions()
	if !hasActive {
		fmt.Println(
			"Tried to UpdateAllSessions with ParticipantVoteResponse but no active connections",
		)
	}

	// this will update hosts and participants every second
	go room.RoomTicker(cancellableCtx)
	log.Printf("Waiting on done or session errors")
	select {
	case <-ctx.Done():
		log.Println(room.Status.RoomCode, " Host session cancelled")
		return nil
	case err := <-session.errChan:
		log.Println(room.Status.RoomCode, " Host session got errChan ", err)
		return err
	}
}

// jsonify just makes indented json out of anything
func jsonify(v any) string {
	b, err := json.MarshalIndent(v, "", "\t")
	if err != nil {
		return ""
	}
	return string(b)
}

func (ps *PollServer) ParticipantAudienceJoinRequest(
	ctx context.Context,
	req *connect.Request[v1.ParticipantAudienceJoinEventMessage],
	stream *connect.ServerStream[v1.ParticipantAudienceJoinResponse],
) error {
	nickname := req.Msg.Nickname
	roomCode := req.Msg.RoomCode
	fmt.Println("Got ParticipantAudienceJoinRequest", roomCode, nickname)

	room := ps.Rooms[roomCode]
	session := &UserSession{
		Stream: stream,
		CommonSession: CommonSession{
			NickName:      nickname,
			RoomCode:      roomCode,
			Game:          room.Status.Game,
			IsAudience:    req.Msg.Audience,
			IsParticipant: req.Msg.Participant,
			IsHost:        false,
			IsActive:      true,
			errChan:       make(chan error),
		},
	}
	fmt.Println("Session:\n" + jsonify(session.CommonSession))

	room.mu.Lock()
	room.Sessions = append(room.Sessions, session)
	for i := range room.Sessions {
		fmt.Println("Session", i, room.Sessions[i].GetNickName())
	}
	fmt.Println("RoomUserSessionLen:", len(ps.Rooms[roomCode].Sessions))
	if req.Msg.Participant {
		participants := room.Status.Participants

		participants = append(participants, nickname)
		fmt.Println("for room:", room.Status.RoomCode, "new participants:", participants)
		room.Status.Participants = participants
	} else if req.Msg.Audience {
		ps.Rooms[session.RoomCode].Status.AudienceList = append(
			ps.Rooms[session.RoomCode].Status.AudienceList, nickname)
	}
	room.mu.Unlock()
	log.Printf("User %s joined room %s", session.NickName, roomCode)

	// do we want to immediately inform everyone someone joined,
	// or wait for tick?
	hasActive := room.UpdateAllSessions()
	if !hasActive {
		fmt.Println(
			"Tried to UpdateAllSessions with ParticipantVoteResponse but no active connections",
		)
	}

	log.Printf("Waiting on done or session errors")
	select {
	case <-ctx.Done():
		log.Println(room.Status.RoomCode, "Participant", nickname, "session cancelled")
		return nil
	case err := <-session.errChan:
		log.Println(room.Status.RoomCode, "Participant", nickname, "session got errChan ", err)
		return err
	}
}

func (ps *PollServer) ParticipantVoteRequest(
	_ context.Context,
	req *connect.Request[v1.ParticipantVoteEventMessage],
) (*connect.Response[v1.ParticipantVoteResponse], error) {
	roomCode := req.Msg.RoomCode
	room := ps.Rooms[roomCode]
	room.mu.Lock()
	room.Status.Votes = append(
		room.Status.Votes,
		req.Msg.Vote)
	room.mu.Unlock()

	// do we want to immediately inform everyone someone voted,
	// or wait for tick?
	// do we want to immediately inform everyone voting started,
	// or wait for tick?
	hasActive := room.UpdateAllSessions()
	if !hasActive {
		fmt.Println(
			"Tried to UpdateAllSessions with ParticipantVoteResponse but no active connections",
		)
	}

	return &connect.Response[v1.ParticipantVoteResponse]{
		Msg: &v1.ParticipantVoteResponse{
			UpdateResultsMessage: room.Status,
		},
	}, nil
}

func (ps *PollServer) StartVotingRequest(
	_ context.Context,
	req *connect.Request[v1.StartVotingEventMessage],
) (*connect.Response[v1.StartVotingResponse], error) {
	roomCode := req.Msg.RoomCode
	room := ps.Rooms[roomCode]
	room.mu.Lock()
	room.Status.VotingStarted = true
	timeNow := time.Now()

	timestamp := timestamppb.New(timeNow)
	room.Status.VotingStartTime = timestamp

	seconds := strings.ReplaceAll(room.Status.TimedDuration, "s", "")
	if d, err := strconv.ParseInt(seconds, 10, 64); err == nil {
		endTimestamp := timestamppb.Timestamp{
			Seconds: timestamp.Seconds + d,
			Nanos:   timestamp.Nanos,
		}
		room.Status.VotingEndTime = &endTimestamp
	}
	room.mu.Unlock()

	// do we want to immediately inform everyone voting started,
	// or wait for tick?
	hasActive := room.UpdateAllSessions()
	if !hasActive {
		fmt.Println("Tried to UpdateAllSessions with StartVotingRequest but no active connections")
	}

	return &connect.Response[v1.StartVotingResponse]{
		Msg: &v1.StartVotingResponse{
			UpdateResultsMessage: room.Status,
		},
	}, nil
}

func (ps *PollServer) EndVotingRequest(
	_ context.Context,
	req *connect.Request[v1.EndVotingEventMessage],
) (*connect.Response[v1.EndVotingResponse], error) {
	roomCode := req.Msg.RoomCode
	room := ps.Rooms[roomCode]
	room.mu.Lock()
	room.Status.VotingClosed = true
	timeNow := time.Now()
	timestamp := timestamppb.New(timeNow)
	room.Status.VotingEndTime = timestamp
	room.Status.DurationRemaining = "0s"
	room.mu.Unlock()

	// do we want to immediately inform everyone voting ended,
	// or wait for tick?
	hasActive := room.UpdateAllSessions()
	if !hasActive {
		fmt.Println("Tried to UpdateAllSessions with EndVotingRequest but no active connections")
	}

	return &connect.Response[v1.EndVotingResponse]{
		Msg: &v1.EndVotingResponse{
			UpdateResultsMessage: room.Status,
		},
	}, nil
}

func (ps *PollServer) SubscribeRequest(ctx context.Context,
	req *connect.Request[v1.SubscribeRequestMessage],
	stream *connect.ServerStream[v1.SubscribeResponse],
) error {
	roomCode := req.Msg.RoomCode
	nickname := req.Msg.Nickname
	session := &SubscribeSession{
		Stream: stream,
		CommonSession: CommonSession{
			RoomCode:      roomCode,
			Game:          req.Msg.Game,
			NickName:      nickname,
			IsHost:        nickname == "",
			IsParticipant: req.Msg.Participant,
			IsAudience:    req.Msg.Audience,
			IsActive:      true,
			errChan:       make(chan error),
		},
	}
	if nickname != "" {
		nickname = "Host"
	}

	fmt.Println("Got SubscribeRequest", roomCode, nickname)
	log.Printf("Waiting on done or session errors")
	select {
	case <-ctx.Done():
		log.Println(roomCode, nickname, "session cancelled")
		return nil
	case err := <-session.errChan:
		log.Println(roomCode, nickname, "session got errChan ", err)
		return err
	}
}
