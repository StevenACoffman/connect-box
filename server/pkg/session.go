package server

import (
	"errors"
	"fmt"

	"connectrpc.com/connect"

	v1 "github.com/Khan/hackathon-khanmigogo/server/poll/v1"
)

type StreamSender interface {
	StreamSend(currentResults *v1.UpdateResultsMessage) error
	GetNickName() string
	Sendable() bool
	End(err error)
}

type CommonSession struct {
	RoomCode      string
	Game          string
	NickName      string
	IsParticipant bool
	IsAudience    bool
	IsHost        bool
	IsActive      bool
	errChan       chan error
}

type UserSession struct {
	Stream *connect.ServerStream[v1.ParticipantAudienceJoinResponse]
	CommonSession
}

type HostSession struct {
	Stream *connect.ServerStream[v1.GameRoomCreateResponse]
	CommonSession
}

type SubscribeSession struct {
	Stream *connect.ServerStream[v1.SubscribeResponse]
	CommonSession
}

func (session *CommonSession) GetNickName() string {
	if session.IsHost {
		return "Host"
	}
	return session.NickName
}

func (session *CommonSession) End(err error) {
	session.IsActive = false
	session.errChan <- err
}

func (session *HostSession) StreamSend(currentResults *v1.UpdateResultsMessage) error {
	fmt.Println("Host StreamSend", session.RoomCode, session.GetNickName())
	var err error
	// this is a standard panic recover.
	// Recover can only be called in a deferred function.
	defer func() {
		if r := recover(); r != nil {
			err = PanicRecoverHandler(r)
		}
	}()
	err = session.Stream.Send(
		&v1.GameRoomCreateResponse{
			UpdateResultsMessage: currentResults,
		},
	)

	return err
}

func (session *HostSession) Sendable() bool {
	return session.IsActive && session.Stream != nil
}

func (session *UserSession) StreamSend(currentResults *v1.UpdateResultsMessage) error {
	fmt.Println("User StreamSend", session.RoomCode, session.GetNickName())
	err := session.Stream.Send(
		&v1.ParticipantAudienceJoinResponse{
			UpdateResultsMessage: currentResults,
		},
	)
	// this is a standard panic recover.
	// Recover can only be called in a deferred function.
	defer func() {
		if r := recover(); r != nil {
			err = PanicRecoverHandler(r)
		}
	}()
	return err
}

func (session *UserSession) Sendable() bool {
	return session.IsActive && session.Stream != nil
}

func (session *SubscribeSession) StreamSend(currentResults *v1.UpdateResultsMessage) error {
	fmt.Println("Subscribe StreamSend", session.RoomCode, session.GetNickName())
	err := session.Stream.Send(
		&v1.SubscribeResponse{
			UpdateResultsMessage: currentResults,
		},
	)
	// this is a standard panic recover.
	// Recover can only be called in a deferred function.
	defer func() {
		if r := recover(); r != nil {
			err = PanicRecoverHandler(r)
		}
	}()
	return err
}

func (session *SubscribeSession) Sendable() bool {
	return session.IsActive && session.Stream != nil
}

// PanicRecoverHandler coerces the recover() any result into an error
func PanicRecoverHandler(r any) error {
	var err error
	switch v := r.(type) {
	case string:
		err = errors.New(v)
	case error:
		err = v
	default:
		err = errors.New(fmt.Sprint(v))
	}
	if err != nil {
		fmt.Printf("Panic Error sending message: %v\n", err)
	}
	return err
}
