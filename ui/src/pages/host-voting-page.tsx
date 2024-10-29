import { Box } from "@mui/material";
import { AnswerOption } from "../shared/answer-option";
import { DefaultPageWrapper } from "../shared/default-page-wrapper";
import { Participants } from "./participants";
import { PollBattleButton } from "../shared/poll-battle-button";
import { darkGrey } from "../shared/colors";
import { QuestionBox } from "../shared/question-box";
import { useCallback, useContext, useEffect, useState } from "react";
import { GameStateContext } from "../game-state-provider";
import { useClient } from "../useClient";
import { PollService } from "../proto/server/poll/v1/poll_connect";
import { EndVotingEventMessage } from "../proto/server/poll/v1/poll_pb";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../shared/error-message";
import {Timer} from "../shared/timer";

export const HostVotingPage = () => {
  const { gameState } = useContext(GameStateContext);
  const client = useClient(PollService);
  const question = gameState.QuestionsAndAnswers[0].Question;
  const answers = gameState.QuestionsAndAnswers[0].Answers;
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  const handleEndVoting = useCallback(async () => {
    setLoading(true);
    const payload: EndVotingEventMessage = {
      RoomCode: gameState.RoomCode,
      Game: "PollBattle",
    } as EndVotingEventMessage;

    try {
      await client.endVotingRequest(payload);
    } catch (e) {
      setHasError(true);
      setLoading(false);
      return;
    }

    navigate("/apps/poll-battle/results");
    setLoading(false);
  }, [client, gameState.RoomCode, navigate]);

  useEffect(() => {
    if (gameState.VotingClosed) {
      handleEndVoting();
    }
  }, [gameState.VotingClosed, handleEndVoting]);

  // Watch VotingClosed to navigate to results page
  const manualEndVoting = () => {
    handleEndVoting();
  };

  return (
    <DefaultPageWrapper>
      <Box sx={styles.container}>
        <Box sx={styles.leftContainer}>
          <QuestionBox text={question} />
          {answers.map(({ answer }, index) => (
            <AnswerOption key={index} text={answer} index={index} />
          ))}
        </Box>
        <Box sx={styles.rightContainer}>
          <Participants height={"507px"} countType="vote" />
          <Box sx={styles.bottomRight}>
            {gameState.TimedDuration !== "0s" && <Timer duration={gameState.DurationRemaining} />}
            <PollBattleButton onClick={manualEndVoting} disabled={loading}>
              End Voting
            </PollBattleButton>
            {hasError && <ErrorMessage />}
          </Box>
        </Box>
      </Box>
    </DefaultPageWrapper>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "80px",
  },
  leftContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "20px",
    color: darkGrey,
  },
  bottomRight: {
    display: "flex",
    gap: "20px",
  },
  timer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  timerText: {
    fontSize: "70px",
    color: darkGrey,
  },
  rightContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "20px",
    color: darkGrey,
  },
};
