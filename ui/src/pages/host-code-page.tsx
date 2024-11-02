import { Box, Button, Snackbar, SnackbarContent } from "@mui/material";
import { eggplant, white } from "../shared/colors";
import { Spacer } from "../shared/spacer";
import { buttonFontSize, formWidth } from "../shared/constants";
import React, { useContext, useEffect, useState } from "react";
import { Participants } from "./participants";
import { DefaultPageWrapper } from "../shared/default-page-wrapper";
import { PollBattleButton } from "../shared/poll-battle-button";
import { GameStateContext } from "../game-state-provider";
import { useClient } from "../useClient";
import { PollService } from "../proto/server/poll/v1/poll_pb";
import { StartVotingEventMessage } from "../proto/server/poll/v1/poll_pb";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../shared/error-message";

export interface SnackbarMessage {
  message: string;
  key: number;
}

export const HostCodePage = () => {
  const { gameState, setRoom, room: code } = useContext(GameStateContext);
  const [snackbarMessages, setSnackbarMessages] = React.useState<
    readonly SnackbarMessage[]
  >([]);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessageInfo, setSnackbarMessageInfo] = React.useState<
    SnackbarMessage | undefined
  >(undefined);
  const client = useClient(PollService);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (snackbarMessages.length && !snackbarMessageInfo) {
      setSnackbarMessageInfo({ ...snackbarMessages[0] });
      setSnackbarMessages((prev) => prev.slice(1));
      setSnackbarOpen(true);
    } else if (snackbarMessages.length && snackbarMessageInfo && snackbarOpen) {
      setSnackbarOpen(false);
    }
  }, [snackbarMessages, snackbarMessageInfo, snackbarOpen]);

  const handleCopy = (message: string, copyText: string) => {
    navigator.clipboard.writeText(copyText);

    setSnackbarMessages((prev) => [
      ...prev,
      { message, key: new Date().getTime() },
    ]);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSnackbarExited = () => {
    setSnackbarMessageInfo(undefined);
  };

  const handleStart = async () => {
    setLoading(true);
    const payload: StartVotingEventMessage = {
      RoomCode: code,
      Game: "PollBattle",
      VotingStarted: true,
    } as StartVotingEventMessage;

    try {
      await client.startVotingRequest(payload);
    } catch (e) {
      setHasError(true);
      setLoading(false);
      return;
    }

    navigate("/apps/poll-battle/host-voting");
    setLoading(false);
  };

  // On mount, fetch the room code
  useEffect(() => {
    setRoom(gameState.RoomCode);
  }, [gameState.RoomCode, setRoom]);

  return (
    <DefaultPageWrapper>
      <Box sx={styles.container}>
        <Box sx={styles.shareAndStart}>
          <Button
            onClick={() =>
              handleCopy("Copied link!", "https://districts.khanacademy.systems/apps/poll-battle/join-room" + code)
            }
            sx={styles.linkButton}
          >
            districts.khanacademy.systems
          </Button>
          <Spacer />
          <Button
            onClick={() => handleCopy("Copied code!", code)}
            sx={styles.codeButton}
          >
            {code}
          </Button>
          <Spacer />
          <PollBattleButton onClick={handleStart} disabled={loading}>
            Start
          </PollBattleButton>
          {hasError && <ErrorMessage />}
          <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            autoHideDuration={6000}
            key={snackbarMessageInfo ? snackbarMessageInfo.key : undefined}
            open={snackbarOpen}
            onClose={handleSnackbarClose}
            TransitionProps={{ onExited: handleSnackbarExited }}
          >
            <SnackbarContent
              message={
                snackbarMessageInfo ? snackbarMessageInfo.message : undefined
              }
              style={styles.snackbar}
            />
          </Snackbar>
        </Box>
        <Participants countType="participant" />
      </Box>
    </DefaultPageWrapper>
  );
};

const styles = {
  container: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
  },
  codeButton: {
    backgroundColor: white,
    borderRadius: "30px",
    color: "#222222",
    fontSize: 170,
    height: "258px",
    textTransform: "uppercase",
    width: `${formWidth}px`,
  },
  linkButton: {
    backgroundColor: eggplant,
    borderRadius: "30px",
    color: white,
    fontSize: "38px",
    height: "87px",
    textTransform: "none",
    width: formWidth,
  },
  shareAndStart: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    paddingRight: "180px",
  },
  snackbar: {
    backgroundColor: eggplant,
  },
};
