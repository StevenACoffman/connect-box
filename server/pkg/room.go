package server

import (
	"context"
	"fmt"
	"sync"
	"time"

	v1 "github.com/Khan/hackathon-khanmigogo/server/poll/v1"
)

type Room struct {
	Status   *v1.UpdateResultsMessage
	Sessions []StreamSender
	Cancel   context.CancelFunc
	mu       sync.RWMutex
}

func (r *Room) RoomTicker(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Second)
	for {
		select {
		case t := <-ticker.C:
			fmt.Println("Tick at", t)
			if r.ShouldDecrementRemainingTime() {
				r.mu.Lock()
				timeNow := time.Now()
				remainingDuration := r.Status.VotingEndTime.AsTime().Sub(
					timeNow)
				if remainingDuration <= 0 {
					remainingDuration = 0
					r.Status.VotingClosed = true
				}

				durationRemainingString := fmt.Sprintf(
					"%ds", int(remainingDuration.Seconds()))
				fmt.Println("New Remaining", durationRemainingString)
				r.Status.DurationRemaining = durationRemainingString
				r.mu.Unlock()
			}

			if !r.UpdateAllSessions() {
				// no active session, so cancel ticker
				r.Cancel()
				// also bail out of infinite for loop
				// so that this go routine will end
				return
			}
			// otherwise wait until next tick
		case <-ctx.Done():
			// context cancelled from somewhere besides this function
			// if got here, then server is shutting down gracefully
			// force all sessions to end state
			r.Status.VotingClosed = true
			r.Status.VotingStarted = true
			r.UpdateAllSessions()
			return
		}
	}
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
	if session.Sendable() {
		fmt.Printf("Sending message to %s from %v\n", nickName, roomCode)
		err := session.StreamSend(r.Status)
		if err != nil {
			fmt.Printf("Error sending message: %v\n", err)
			session.End(err)
		}
		if r.Status.VotingClosed {
			fmt.Printf("Ending Session for user %s for room %s\n", nickName, roomCode)
			session.End(nil)
		}
	} else {
		fmt.Println("Inactive Host session")
	}
	return session.Sendable()
}

func (r *Room) ShouldDecrementRemainingTime() bool {
	return r.Status.VotingStarted &&
		!r.Status.VotingClosed &&
		r.Status.TimedDuration != "0s"
}
