import React from "react";
import pollBattleGameScreen from "../images/poll-battle-components/poll-battle-game-screen-2.png";
import { Box } from "@mui/material";
import { buttonMedBlue, lilac, white } from "../shared/colors";
import {
  buttonFontSize,
  buttonHeight,
  gameScreenButtonWidth,
} from "../shared/constants";
import { PollBattleButton } from "../shared/poll-battle-button";
import { useNavigate } from "react-router-dom";

export const PollBattlePage = () => {
  const navigate = useNavigate();
  return (
    <Box sx={styles.wrapper}>
      <img src={pollBattleGameScreen} alt="poll-battle" />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <PollBattleButton
          onClick={() => navigate("/apps/poll-battle/join-room")}
          styles={styles.joinButton}
        >
          Join
        </PollBattleButton>

        <PollBattleButton
          onClick={() => navigate("/apps/poll-battle/host")}
          styles={styles.hostButton}
        >
          Host
        </PollBattleButton>
      </Box>
    </Box>
  );
};

const styles = {
  wrapper: {
    backgroundColor: lilac,
    height: "100vh",
    width: "100vw",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  joinButton: {
    backgroundColor: buttonMedBlue,
    color: `${white} !important`,
    border: `8px solid #fff`,
    borderRadius: "30px",
    width: `${gameScreenButtonWidth}px`,
    height: `${buttonHeight}px`,
    fontSize: buttonFontSize,
    marginRight: "13px",
  },
  hostButton: {
    backgroundColor: "#14BF96",
    color: `${white} !important`,
    border: `8px solid #fff`,
    borderRadius: "30px",
    width: `${gameScreenButtonWidth}px`,
    height: `${buttonHeight}px`,
    fontSize: buttonFontSize,
  },
};
