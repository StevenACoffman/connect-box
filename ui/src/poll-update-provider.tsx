import { createContext, useContext } from "react";
import {PollService, SubscribeRequestMessage} from "./proto/server/poll/v1/poll_pb";
import { useClient } from "./useClient";
import { GameStateContext } from "./game-state-provider";
import {
  GameRoomCreateEventMessage,
  ParticipantAudienceJoinEventMessage,
  UpdateResultsMessage,
} from "./proto/server/poll/v1/poll_pb";

export const PollUpdateContext = createContext({
  subscribeRequest: async (event: SubscribeRequestMessage) => {},
});

type Props = {
  children: React.ReactNode;
};

export const PollUpdateProvider = ({ children }: Props) => {
  const client = useClient(PollService);
  const { setGameState } = useContext(GameStateContext);

  const subscribeRequest = async (event: SubscribeRequestMessage) => {
    const stream = client.subscribeRequest(event);
    for await (const response of stream) {
      console.log(response);
      setGameState(response.updateResultsMessage as UpdateResultsMessage);
    }
  };

  return (
    <PollUpdateContext.Provider value={{subscribeRequest}}>
      {children}
    </PollUpdateContext.Provider>
  );
};
