import { Box } from "@mui/material";
import { AnswerOption } from "../shared/answer-option";
import { DefaultPageWrapper } from "../shared/default-page-wrapper";
import { darkGrey } from "../shared/colors";
import { useContext, useEffect, useState } from "react";
import check from "../images/poll-battle-components/checked-icon.svg";
import { Spacer } from "../shared/spacer";
import { QuestionBox } from "../shared/question-box";
import { GameStateContext } from "../game-state-provider";
import { useClient } from "../useClient";
import { PollService } from "../proto/server/poll/v1/poll_pb";
import { useNavigate } from "react-router-dom";
import {Timer} from "../shared/timer";

export const GuestVotingPage = () => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { nickname, room, gameState } = useContext(GameStateContext);
  const navigate = useNavigate();
  const client = useClient(PollService);

  const handleSelectAnswer = async (index: number) => {
    if (selectedIndex !== -1) return;
    setSelectedIndex(index);

    const vote = {
      QuestionNumber: 0,
      ParticipantAnswers: [index],
      ParticipantName: nickname,
      // ParticipantHat: "",
    };

    const payload = {
      Vote: vote,
      RoomCode: room,
      Game: "PollBattle",
    };

    console.log(payload);

    await client.participantVoteRequest(payload);
  };

  // When voting ends
  useEffect(() => {
    if (gameState.VotingClosed) {
      // Navigate to the next page
      navigate("/apps/poll-battle/results");
    }
  }, [gameState.VotingClosed, navigate]);

  const question = gameState.QuestionsAndAnswers[0].Question;

  return (
    <DefaultPageWrapper>
      <Box>
        <QuestionBox text={question} width={"1274px"} />
        <Spacer />
        <Box sx={styles.answersContainer}>
          {gameState.QuestionsAndAnswers[0].Answers.map(({ answer }, index) => (
            <Box sx={styles.singleAnswer}>
              {index === selectedIndex ? (
                <img
                  height={"150px"}
                  width={"150px"}
                  src={check}
                  alt="Check icon"
                />
              ) : (
                <span style={{ width: "150px", height: "150px" }} />
              )}
              <AnswerOption
                key={index}
                text={answer}
                index={index}
                onClick={() => handleSelectAnswer(index)}
                selected={selectedIndex === index}
              />
            </Box>
          ))}
        </Box>
        {gameState.TimedDuration !== "0s" && <Timer duration={gameState.DurationRemaining} />}
      </Box>
    </DefaultPageWrapper>
  );
};

const styles = {
  answersContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "20px",
    color: darkGrey,
    width: "1072px",
  },
  singleAnswer: {
    display: "flex",
    flexFlow: "row nowrap",
    gap: "30px",
    alignItems: "center",
  },
  rightContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "20px",
    color: darkGrey,
  },
};
