import enterNameSvg from "../images/enter-name.svg";
import { Spacer } from "../shared/spacer";
import React from "react";
import { DefaultPageWrapper } from "../shared/default-page-wrapper";
import { useNavigate } from "react-router-dom";
import { CustomTextInput } from "../shared/custom-text-input";
import { GameStateContext } from "../game-state-provider";
import { PollBattleButton } from "../shared/poll-battle-button";
import { Box } from "@mui/material";
import {formWidth} from "../shared/constants";

export const GuestCreateNameScreen = () => {
  const navigate = useNavigate();
  const { room, setRoom } = React.useContext(GameStateContext);

  const [name, setName] = React.useState("");
  const handler = () => {
    console.log(name);
    // navigate("/apps/poll-battle/join"); 
  };

  return (
    <DefaultPageWrapper>
      <Box sx={{ width: formWidth }}>
        <img src={enterNameSvg} alt="enter-name" />
        <Spacer />
        <CustomTextInput
          value={name}
          onChange={setName}
          uppercase={false}
          fontSize={60}
        />
        <Spacer />
        <PollBattleButton disabled={name.length < 1} onClick={handler}>
          Enter PollBattle
        </PollBattleButton>
      </Box>
    </DefaultPageWrapper>
  );
};
