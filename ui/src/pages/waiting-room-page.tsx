import React, { useEffect } from "react";
import { DefaultPageWrapper } from "../shared/default-page-wrapper";
import { Box, Typography } from "@mui/material";
import { Participants } from "./participants";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../shared/error-message";
import { GameStateContext } from "../game-state-provider";

export const WaitingRoomPage = () => {
  const navigate = useNavigate();
  const { gameState } = React.useContext(GameStateContext);
  // Currently there's no way to trigger an error
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    if (gameState.VotingStarted) {
      navigate("/apps/poll-battle/guest-voting");
    }
  }, [gameState.VotingStarted, navigate]);

  return (
    <DefaultPageWrapper>
      <Box sx={styles.container}>
        {hasError ? (
          <ErrorMessage big={true} />
        ) : (
          <Typography align="center" variant="h1" sx={styles.waitingText}>
            Waiting for host to start game
          </Typography>
        )}
        <Box sx={styles.participantsWrapper}>
          <Participants
            height={"95vh"}
            width={"500px"}
            showFaceOnly={true}
            participantTextFontSize="35px"
          />
        </Box>
      </Box>
    </DefaultPageWrapper>
  );
};

const styles = {
  container: {
    alignItems: "center",
    display: "flex",
    width: "100%",
  },
  waitingText: {
  },
  participantsWrapper: {
    marginRight: "50px",
  },
};
