import { Box, Typography } from "@mui/material";
import { white } from "./colors";

type Props = {
  text: string;
  width?: string;
};

export const QuestionBox = ({ text, width = "100%" }: Props) => {
  const containerStyle = {
    ...internalStyles.questionContainer,
    width,
  };
  return (
    <Box sx={containerStyle}>
      <Typography sx={internalStyles.question}>{text}</Typography>
    </Box>
  );
};

const internalStyles = {
  questionContainer: {
    width: "1274px",
    height: "83px",
    backgroundColor: white,
    borderRadius: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  question: {
    fontSize: "42px",
    fontWeight: 700,
  },
};
