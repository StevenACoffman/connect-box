import { createContext, useState } from "react";
import { mockGameState } from "./mocks";
import { UpdateResultsMessage } from "./proto/server/poll/v1/poll_pb";

export const GameStateContext = createContext({
  nickname: "",
  room: "",
  gameState: mockGameState as UpdateResultsMessage,
  setNickname: (nickname: string) => {},
  setRoom: (room: string) => {},
  setGameState: (gameState: UpdateResultsMessage) => {},
});

type Props = {
  children: React.ReactNode;
};

export const GameStateProvider = ({ children }: Props) => {
  const [nickname, setNickname] = useState("");
  const [room, setRoom] = useState("");
  const [gameState, setGameState] = useState<UpdateResultsMessage>(
    mockGameState as UpdateResultsMessage
  );

  return (
    <GameStateContext.Provider
      value={{
        nickname,
        room,
        gameState,
        setNickname,
        setRoom,
        setGameState,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};
