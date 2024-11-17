import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import logo from "../images//khanmigogo.png";
import timeLimitIcon from "../images/poll-battle-components/time-limit.svg";
import { useContext, useState } from "react";
import { DefaultPageWrapper } from "../shared/default-page-wrapper";
import { CustomTextInput } from "../shared/custom-text-input";
import { PollBattleButton } from "../shared/poll-battle-button";
import { PollUpdateContext } from "../poll-update-provider";
import {
  Answer,
  GameRoomCreateEventMessage, GameRoomCreateResponse, PollService,
  QuestionAndAnswers, SubscribeRequestMessage,
} from "../proto/server/poll/v1/poll_pb";
import { useNavigate } from "react-router-dom";
import {useClient} from "../useClient";
import {ErrorMessage} from "../shared/error-message";

const TIMER_OPTIONS = [
  {
    value: 30,
    label: "30 seconds",
  },
  {
    value: 60,
    label: "60 seconds",
  },
  {
    value: 120,
    label: "120 seconds",
  },
  {
    value: 0,
    label: "No limit",
  },
];

const ANSWER_OPTIONS = [
  {
    value: "",
    placeholder: "Option 1",
    borderColor: "#14BF96",
  },
  {
    value: "",
    placeholder: "Option 2",
    borderColor: "#D92916",
  },
  {
    value: "",
    placeholder: "Option 3",
    borderColor: "#FFB100",
  },
];

export const HostSetupPage = () => {
  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState(TIMER_OPTIONS[1].value);
  const [answerOptions, setAnswerOptions] = useState(ANSWER_OPTIONS);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const client = useClient(PollService);
  const [hasError, setHasError] = useState(false);
  const pollUpdateContext = useContext(PollUpdateContext);

  const handleAnswerOptionChange = (value: string, index: number) => {
    setAnswerOptions(
      answerOptions.map((option, i) => {
        if (i === index) {
          return {
            ...option,
            value,
          };
        }
        return option;
      })
    );
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
  };

  const handleTimeLimitChange = (e: SelectChangeEvent) => {
    setTimeLimit(+e.target.value);
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    const qAndA: QuestionAndAnswers[] = [
      {
        Question: question,
        Answers: answerOptions.map((option) => ({
          answer: option.value,
        })) as Answer[],
      } as QuestionAndAnswers,
    ];

    const payload: GameRoomCreateEventMessage = {
      Game: "PollBattle",
      QuestionsAndAnswers: qAndA,
      TimedDuration: `${timeLimit}s`,
    } as GameRoomCreateEventMessage;

      try {
        const resp: GameRoomCreateResponse = await client.gameRoomCreateRequest(payload);
        if (!resp.updateResultsMessage?.RoomCode) {
            throw new Error("No room code in response");
        }
        // Fire off the subscribe request asynchronously, the provider will
        // update the game state.
        pollUpdateContext.subscribeRequest({
            RoomCode: resp.updateResultsMessage?.RoomCode,
        } as SubscribeRequestMessage);
        setHasError(false);
        // Navigate to the waiting room
        navigate("/apps/poll-battle/host-code");
      } catch (err){
        console.log(err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
  };

  const generateButtonDisabled =
    question.length === 0 ||
    answerOptions.some((option) => option.value.length === 0) ||
    loading;

  return (
    <DefaultPageWrapper>
      <Box sx={styles.container}>
        <Box sx={styles.leftColumn}>
          <img src={logo} alt="KhanmigoGO" style={{ maxWidth: 212 }} />
          <Box sx={styles.questionPrompt}>
            <Typography sx={styles.questionPromptText}>
              What's your poll question?
            </Typography>
          </Box>
          <CustomTextInput
            value={question}
            onChange={handleQuestionChange}
            uppercase={false}
            fontSize={42}
            placeholder={"Question..."}
            styles={{
              height: "220px",
            }}
            multiline={true}
          />
          <Box sx={styles.timeLimit}>
            <Box sx={styles.timeLimitText}>
              <img src={timeLimitIcon} alt="Time limit" />
              <Typography>Time limit</Typography>
            </Box>
            <Select
              style={styles.timeLimitSelect}
              value={String(timeLimit)}
              onChange={handleTimeLimitChange}
            >
              {TIMER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <PollBattleButton
            onClick={handleCreateRoom}
            disabled={generateButtonDisabled}
          >
            Generate Poll Code
          </PollBattleButton>
            {hasError && (
                <ErrorMessage />
            )}
        </Box>
        <Box sx={styles.rightColumn}>
          <Box>
            <Typography sx={styles.inputText}>
              Input your answers:
            </Typography>
          </Box>
          <Box sx={styles.answerOptions}>
            {answerOptions.map((option, i) => {
              const style = {
                ...styles.answerOption,
                border: `8px solid ${option.borderColor}`,
              };
              return (
                <CustomTextInput
                  key={i}
                  placeholder={option.placeholder}
                  value={option.value}
                  onChange={(value) => handleAnswerOptionChange(value, i)}
                  uppercase={false}
                  fontSize={32}
                  styles={style}
                  multiline
                />
              );
            })}
          </Box>
        </Box>
      </Box>
    </DefaultPageWrapper>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "60px",
    height: "50vh",
  },
  questionPrompt: {
    boxSizing: "border-box" as const,
    width: "100%",
    borderRadius: "30px",
    backgroundColor: "#3C285A",
    color: "white",
    display: "flex",
    alignItems: "center",
    padding: "12px 34px",
  },
  questionPromptText: {
    fontSize: "24px",
    fontWeight: "700",
  },
  questionInput: {
    backgroundColor: "white",
    height: "220px",
    width: "100%",
    borderRadius: "30px",
    border: "none",
    fontSize: "42px",
    fontWeight: "700",
    padding: "36px",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: "20px",
  },
  timeLimit: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLimitText: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  timeLimitSelect: {
    width: "375px",
    backgroundColor: "white",
    borderRadius: "8px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    gap: "20px",
  },
  inputText: {
    fontSize: "24px",
    fontWeight: "700",
  },
  answerOptions: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  answerOption: {
    boxSizing: "border-box" as const,
    height: 150,
    padding: "8px",
  },
};
