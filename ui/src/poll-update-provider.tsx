import { createContext, useContext } from "react";
import { PollService } from "./proto/server/poll/v1/poll_connect";
import { useClient } from "./useClient";
import { GameStateContext } from "./game-state-provider";
import {
  GameRoomCreateEventMessage,
  ParticipantAudienceJoinEventMessage,
  UpdateResultsMessage,
} from "./proto/server/poll/v1/poll_pb";

export const PollUpdateContext = createContext({
  hostCreateRoom: async (event: GameRoomCreateEventMessage) => {},
  participantJoinRoom: async (event: ParticipantAudienceJoinEventMessage) => {},
});

type Props = {
  children: React.ReactNode;
};

export const PollUpdateProvider = ({ children }: Props) => {
  const client = useClient(PollService);
  const { setGameState } = useContext(GameStateContext);

  const hostCreateRoom = async (event: GameRoomCreateEventMessage) => {
    const stream = client.gameRoomCreateRequest(event);
    console.log({ stream });
    for await (const response of stream) {
      console.log({ response });
      setGameState(response.updateResultsMessage as UpdateResultsMessage);
    }
  };

  const participantJoinRoom = async (
    event: ParticipantAudienceJoinEventMessage
  ) => {
    const stream = client.participantAudienceJoinRequest(event);
    for await (const response of stream) {
      console.log(response);
        setGameState(response.updateResultsMessage as UpdateResultsMessage);
    }
  };

  return (
    <PollUpdateContext.Provider
      value={{
        hostCreateRoom,
        participantJoinRoom,
      }}
    >
      {children}
    </PollUpdateContext.Provider>
  );
};
