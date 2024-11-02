package server

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"google.golang.org/protobuf/types/known/timestamppb"

	v1 "github.com/Khan/hackathon-khanmigogo/server/poll/v1"
)

type Room struct {
	Status      *v1.UpdateResultsMessage
	Sessions    []StreamSender
	Cancel      context.CancelCauseFunc // GameRoomCreateRequest Host session ctx
	mu          sync.RWMutex
	StreamDelay time.Duration
}

func (r *Room) RoomTicker(ctx context.Context) {
	ticker := time.NewTicker(r.StreamDelay)
	for {
		select {
		case t := <-ticker.C:
			fmt.Println("Room Tick at:", t, "sessions:", len(r.Sessions))
			fmt.Println(jsonify(r.Status))
			if r.ShouldDecrementRemainingTime() {
				r.DecrementRemainingTime()
			}
			if !r.HasActiveSessions() {
				// no active session, so end ticker
				fmt.Println("No active sessions, so ending ticker for room", r.Status.RoomCode)
				// r.Cancel(fmt.Errorf("RoomTicker No active sessions for " + r.Status.RoomCode))
				// also bail out of infinite for loop
				// so that this go routine will end
				return
			}

			// otherwise wait until next tick or done
			//case <-ctx.Done():
			//	// room context cancelled from somewhere besides this function
			//	// if got here, shut down gracefully
			//	// force all sessions to end state
			//	fmt.Println("RoomTicker Context cancelled, so closing voting for room",
			//		r.Status.RoomCode, "ctx.Err:", context.Cause(ctx))
			//	fmt.Println()
			//	r.CloseVoting()
			//	hasActiveSessions := r.UpdateAllSessions()
			//	fmt.Println("after closing voting for room",
			//		r.Status.RoomCode, "hasActiveSessions:", hasActiveSessions)
			//	return
		}
	}
}

func (r *Room) DecrementRemainingTime() {
	r.mu.Lock()
	timeNow := time.Now()
	remainingDuration := r.Status.VotingEndTime.AsTime().Sub(
		timeNow)
	if remainingDuration <= 0 {
		fmt.Println("Remaining duration too short, so closing voting",
			r.Status.RoomCode)
		remainingDuration = 0
		r.Status.VotingClosed = true
	}

	durationRemainingString := fmt.Sprintf(
		"%ds", int(remainingDuration.Seconds()))
	fmt.Println("New Remaining", durationRemainingString)
	r.Status.DurationRemaining = durationRemainingString
	r.mu.Unlock()
}

func (r *Room) HasActiveSessions() bool {
	hasActiveSessions := false
	for _, session := range r.Sessions {
		hasActiveSessions = session.Sendable() || hasActiveSessions
	}
	return hasActiveSessions
}

func (r *Room) UpdateAllSessions() bool {
	fmt.Println("Update All Sessions with", len(r.Sessions), "Sessions in room", r.Status.RoomCode)
	haveActiveSessions := false
	for i := range r.Sessions {
		haveActiveSessions = r.SendSessionUpdate(r.Sessions[i]) || haveActiveSessions
	}
	return haveActiveSessions
}

func (r *Room) SendSessionUpdate(session StreamSender) bool {
	nickName := session.GetNickName()
	roomCode := r.Status.RoomCode

	fmt.Printf("Sending message to %s from %v\n", nickName, roomCode)
	err := r.SendStatusUpdate(session)
	if err != nil {
		fmt.Printf("Error sending message to %s from %v: %v\n", nickName, roomCode, err)
		return false
	}
	return session.Sendable()
}

func (r *Room) SendPeriodicUpdates(ctx context.Context, session StreamSender) error {
	roomStatus := r.Status
	ticker := time.NewTicker(r.StreamDelay)
	defer ticker.Stop()
	for {
		select {
		//case <-ctx.Done():
		//	fmt.Println(
		//		roomStatus.RoomCode,
		//		session.GetNickName(),
		//		"Ticker context cancelled, so closing voting for room",
		//	)
		//	r.CloseVoting()
		//	if err := r.SendStatusUpdate(session); err != nil {
		//		fmt.Println(roomStatus.RoomCode, session.GetNickName(), err)
		//		return err
		//	}
		//	return ctx.Err()
		case err := <-session.ErrChan():
			log.Println(roomStatus.RoomCode, session.GetNickName(), "session got errChan ", err)
			return err
		case <-ticker.C:
			if err := r.SendStatusUpdate(session); err != nil {
				fmt.Println(roomStatus.RoomCode, session.GetNickName(), "Session ticker got error")
				return err
			}
		}
	}
}

func (r *Room) SendStatusUpdate(session StreamSender) error {
	roomStatus := r.Status
	nickName := session.GetNickName()
	roomCode := roomStatus.RoomCode
	if !session.Sendable() {
		return fmt.Errorf("Sending unsendable message to %s from %v", nickName, roomCode)
	}

	err := session.StreamSend(roomStatus)
	if err != nil {
		fmt.Printf("Error sending message to %s from %v: %v\n", nickName, roomCode, err)
		session.End(err)
	}
	if roomStatus.VotingClosed {
		fmt.Printf("Ending Session for user %s for room %s\n", nickName, roomCode)
		session.End(nil)
	}
	return err
}

func (r *Room) ShouldDecrementRemainingTime() bool {
	return r.Status.VotingStarted &&
		!r.Status.VotingClosed &&
		r.Status.TimedDuration != "0s"
}

func (r *Room) CloseVoting() {
	if r.Status.VotingClosed {
		// no-op, as already done
		return
	}
	r.mu.Lock()
	r.Status.VotingClosed = true
	timeNow := time.Now()
	timestamp := timestamppb.New(timeNow)
	r.Status.VotingEndTime = timestamp
	if !r.Status.VotingStarted {
		r.Status.VotingStarted = true
		r.Status.VotingStartTime = timestamp
	}
	r.Status.DurationRemaining = "0s"
	r.mu.Unlock()
}

func (r *Room) StartVoting() {
	if r.Status.VotingStarted {
		// no-op, as already done
		return
	}
	r.mu.Lock()
	r.Status.VotingStarted = true
	timeNow := time.Now()

	timestamp := timestamppb.New(timeNow)
	r.Status.VotingStartTime = timestamp

	seconds := strings.ReplaceAll(r.Status.TimedDuration, "s", "")
	if d, err := strconv.ParseInt(seconds, 10, 64); err == nil {
		endTimestamp := timestamppb.Timestamp{
			Seconds: timestamp.Seconds + d,
			Nanos:   timestamp.Nanos,
		}
		r.Status.VotingEndTime = &endTimestamp
	}
	r.mu.Unlock()
}

func (r *Room) AddVote(vote *v1.Vote) {
	r.mu.Lock()
	r.Status.Votes = append(
		r.Status.Votes,
		vote)
	r.mu.Unlock()
}

func (room *Room) JoinRoom(
	session *UserSession,
	nickname string,
	isParticipant bool,
	isAudience bool,
) {
	room.mu.Lock()
	room.Sessions = append(room.Sessions, session)
	fmt.Println("RoomUserSessionLen:", len(room.Sessions))
	if isParticipant {
		participants := room.Status.Participants
		participants = append(participants, nickname)
		fmt.Println("for room:", room.Status.RoomCode, "new participants:", participants)
		room.Status.Participants = participants
	} else if isAudience {
		room.Status.AudienceList = append(
			room.Status.AudienceList, nickname)
	}
	room.mu.Unlock()
}
