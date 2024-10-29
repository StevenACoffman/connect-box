import React from "react";
import { Routes, Route } from "react-router-dom";
import JoinPage from "./pages/JoinPage";
import ChatPage from "./pages/ChatPage";
import { HomePage } from "./pages/home-page";
import { PollBattlePage } from "./pages/poll-battle-page";
import { JoinRoomPage } from "./pages/join-room-page";
import { ThemeProvider } from "@mui/material";
import { THEME } from "./theme";
import { GameStateProvider } from "./game-state-provider";
import { HostSetupPage } from "./pages/host-setup-page";
import { HostCodePage } from "./pages/host-code-page";
import { HostVotingPage } from "./pages/host-voting-page";
import { GuestVotingPage } from "./pages/guest-voting-page";
import { ResultsPage } from "./pages/results-page";
import { WaitingRoomPage } from "./pages/waiting-room-page";
import { PollUpdateProvider } from "./poll-update-provider";

const App: React.FC = () => {
  return (
    <ThemeProvider theme={THEME}>
      <GameStateProvider>
        <PollUpdateProvider>
          <Routes>
            <Route path="/" element={<JoinPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/apps/poll-battle" element={<PollBattlePage />} />
            <Route
              path="/apps/poll-battle/join-room"
              element={<JoinRoomPage />}
            />
            <Route
              path="/apps/poll-battle/waiting-room"
              element={<WaitingRoomPage />}
            />
            <Route path="/apps/poll-battle/host" element={<HostSetupPage />} />
            <Route
              path="/apps/poll-battle/host-code"
              element={<HostCodePage />}
            />
            <Route
              path="/apps/poll-battle/host-voting"
              element={<HostVotingPage />}
            />
            <Route
              path="/apps/poll-battle/guest-voting"
              element={<GuestVotingPage />}
            />
            <Route path="/apps/poll-battle/results" element={<ResultsPage />} />
          </Routes>
        </PollUpdateProvider>
      </GameStateProvider>
    </ThemeProvider>
  );
};

export default App;
