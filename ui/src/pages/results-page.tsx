import { Box, Typography } from "@mui/material";
import { AnswerOption } from "../shared/answer-option";
import { DefaultPageWrapper } from "../shared/default-page-wrapper";
import starIcon from "../images/poll-battle-components/star-icon.svg";
import { PollBattleButton } from "../shared/poll-battle-button";
import {
  darkGold,
  darkGreen,
  darkGrey,
  darkRed,
  green,
  white,
} from "../shared/colors";
import { QuestionBox } from "../shared/question-box";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { GameStateContext } from "../game-state-provider";

const INDEX_COLORS = [darkGreen, darkRed, darkGold];

export const ResultsPage = () => {
  const { gameState, nickname } = useContext(GameStateContext);
  console.log({gameState})
  const navigate = useNavigate();

  const question = gameState.QuestionsAndAnswers[0].Question;
  console.log({question})

  const answerData = gameState.Votes.reduce((acc, curr) => {
    const answer = curr.ParticipantAnswers[0];
    if (acc[answer] === undefined) {
      acc[answer] = 1;
    } else {
      acc[answer]++;
    }

    return acc;
  }, [] as number[]);

  console.log({answerData})

  const numberOfVotes = answerData.reduce((acc, curr) => acc + curr, 0);

  console.log({numberOfVotes})
  const answerPercentages = answerData.map((answer) => answer / numberOfVotes)
      .map(pct => isNaN(pct) ? 0 : pct);

  console.log({answerPercentages});
  // [0.8, 0.08, 0.12]
  const winningIndex = answerPercentages.reduce((acc, curr, index) => {
    return curr > answerPercentages[acc] ? index : acc;
  }, 0);
  console.log({winningIndex})

  const answersTextArray = gameState.QuestionsAndAnswers[0].Answers.map(
    (a) => a.answer
  );
  console.log({answersTextArray})

  return (
    <DefaultPageWrapper>
      <Box sx={styles.leftContainer}>
        <QuestionBox text={question} />
        {answersTextArray.map((answer, index) => (
          <Box sx={styles.singleAnswer}>
            {index === winningIndex ? (
              <img
                height={"75px"}
                width={"75px"}
                src={starIcon}
                alt="Star icon"
              />
            ) : (
              <span style={{ width: "75px", height: "75px" }} />
            )}
            <AnswerOption key={index} text={answer} index={index} />
            <Box
              style={{
                marginLeft: "-55px",
                zIndex: 1,
                width: `${(answerPercentages[index] ?? 0) * 200}px`,
                height: "150px",
                backgroundColor: INDEX_COLORS[index],
                borderRadius: "0 20px 20px 0",
              }}
            />
            <Box sx={styles.percentageBox}>
              <Typography sx={styles.percentageText}>
                {Math.round((answerPercentages[index] ?? 0 )* 100)}%
              </Typography>
            </Box>
          </Box>
        ))}
        <Box sx={styles.buttons}>
          {!nickname && (
              <PollBattleButton
                  onClick={() => navigate("/apps/poll-battle/host")}
              >
                New PollBattle
              </PollBattleButton>
          )}
          <PollBattleButton
            onClick={() => navigate("/home")}
            styles={{ backgroundColor: green, maxWidth: "600px" }}
          >
            Explore KhanmigoGO
          </PollBattleButton>
        </Box>
      </Box>
    </DefaultPageWrapper>
  );
};

const styles = {
  singleAnswer: {
    display: "flex",
    flexFlow: "row nowrap",
    gap: "30px",
    alignItems: "center",
  },
  leftContainer: {
    display: "grid",
    alignItems: "flex-end",
    gap: "20px",
    color: darkGrey,
  },
  percentageBox: {
    width: "125px",
    height: "125px",
    backgroundColor: white,
    borderRadius: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontSize: "50px",
  },
  buttons: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    gap: "24px",
  },
};
