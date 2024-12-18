package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"connectrpc.com/connect"

	v1 "github.com/Khan/hackathon-khanmigogo/server/poll/v1"
	pb "github.com/Khan/hackathon-khanmigogo/server/poll/v1/v1connect"
)

type PollServer struct {
	pb.UnimplementedPollServiceHandler
	Rooms       map[string]*Room
	mu          sync.RWMutex
	StreamDelay time.Duration // sleep between streaming response messages
}

func (ps *PollServer) GameRoomCreateRequest(
	ctx context.Context,
	req *connect.Request[v1.GameRoomCreateEventMessage],
) (*connect.Response[v1.GameRoomCreateResponse], error) {
	fmt.Println("Got GameRoomCreateRequest", jsonify(req.Msg))
	fmt.Println(ctx.Deadline())
	// TODO(steve): Randomly generate but avoid collisions
	roomCode := IntToLetters(getRandRoomNumber())
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
		Sessions:    []StreamSender{},
		StreamDelay: time.Duration(ps.StreamDelay),
	}
	ps.mu.Unlock()
	log.Printf("Starting room ticker for %v\n", roomCode)
	room := ps.Rooms[roomCode]
	log.Printf("Sending periodic message to Host from %v\n", roomCode)
	//return room.SendPeriodicUpdates(cancellableCtx, session)
	return &connect.Response[v1.GameRoomCreateResponse]{
		Msg: &v1.GameRoomCreateResponse{
			UpdateResultsMessage: room.Status,
		},
	}, nil
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
) (*connect.Response[v1.ParticipantAudienceJoinResponse], error) {
	nickname := req.Msg.Nickname
	roomCode := req.Msg.RoomCode
	fmt.Println("Got ParticipantAudienceJoinRequest", roomCode, nickname)

	room, ok := ps.Rooms[roomCode]
	if !ok {
		return nil, fmt.Errorf("room %s not in use so can't join it", roomCode)
	}
	room.JoinRoom(nickname, req.Msg.Participant, req.Msg.Audience)
	return &connect.Response[v1.ParticipantAudienceJoinResponse]{
		Msg: &v1.ParticipantAudienceJoinResponse{
			UpdateResultsMessage: room.Status,
		},
	}, nil
}

func (ps *PollServer) ParticipantVoteRequest(
	_ context.Context,
	req *connect.Request[v1.ParticipantVoteEventMessage],
) (*connect.Response[v1.ParticipantVoteResponse], error) {
	roomCode := req.Msg.RoomCode
	room, ok := ps.Rooms[roomCode]
	if !ok || room == nil {
		return nil, fmt.Errorf("Room %s not found", roomCode)
	}
	room.AddVote(req.Msg.Vote)
	// do we want to immediately inform everyone voting started,
	// or wait for tick?
	//hasActive := room.UpdateAllSessions()
	//if !hasActive {
	//	fmt.Println(
	//		"Tried to UpdateAllSessions with ParticipantVoteResponse but no active connections",
	//	)
	//}

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
	room, ok := ps.Rooms[roomCode]
	if !ok {
		return nil, fmt.Errorf("Room %s not found", roomCode)
	}
	room.StartVoting()

	// do we want to immediately inform everyone voting started,
	// or wait for tick?
	//hasActive := room.UpdateAllSessions()
	//if !hasActive {
	// 	fmt.Println("Tried to UpdateAllSessions with StartVotingRequest but no active connections")
	//}

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
	room, ok := ps.Rooms[roomCode]
	if !ok {
		return nil, fmt.Errorf("Room %s not found", roomCode)
	}
	fmt.Println("EndVotingRequest received so closing voting")
	room.CloseVoting()

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
	room, ok := ps.Rooms[roomCode]
	if !ok {
		return fmt.Errorf("Room %s not found", roomCode)
	}
	nickname := req.Msg.Nickname
	isHost := nickname == ""
	session := &SubscribeSession{
		Stream: stream,
		CommonSession: CommonSession{
			RoomCode:      roomCode,
			Game:          req.Msg.Game,
			NickName:      nickname,
			IsHost:        isHost,
			IsParticipant: req.Msg.Participant,
			IsAudience:    req.Msg.Audience,
			IsActive:      true,
			errChan:       make(chan error),
		},
	}
	fmt.Println("Subscribing session", jsonify(session.CommonSession))

	room.SubscribeRoom(session, nickname, req.Msg.Participant, req.Msg.Audience, isHost)

	if isHost {
		cancellableCtx, cancelFn := context.WithCancelCause(ctx)
		room.AddCancel(cancelFn)
		go room.RoomTicker(cancellableCtx)
	}

	return room.SendPeriodicUpdates(ctx, session)
}
