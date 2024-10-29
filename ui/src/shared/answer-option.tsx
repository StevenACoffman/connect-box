import { Box, Typography } from "@mui/material";
import { buttonMedBlue, gold, green, red, white } from "./colors";

type Props = {
  text: string;
  index: number;
  onClick?: () => void;
  selected?: boolean;
};

const INDEX_COLORS = [green, red, gold];

export const AnswerOption = ({
  text,
  index,
  onClick = () => null,
  selected = false,
}: Props) => {
  const textContainerStyle = {
    ...styles.textContainer,
    border: `8px solid ${INDEX_COLORS[index]}`,
  };

  const numberContainerStyle = {
    ...styles.numberContainer,
    backgroundColor: INDEX_COLORS[index],
  };

  const selectedStyle = selected ? styles.selected : styles.unselected;

  return (
    <Box sx={selectedStyle}>
      <Box sx={styles.container} onClick={onClick}>
        <Box sx={numberContainerStyle}>
          <Typography sx={styles.numberText}>{index + 1}</Typography>
        </Box>
        <Box sx={textContainerStyle}>
          <Typography sx={styles.text}>{text}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const styles = {
  unselected: {
    border: `8px solid transparent`,
    borderRadius: "30px",
    zIndex: 2,
  },
  selected: {
    border: `8px solid ${buttonMedBlue}`,
    borderRadius: "30px",
    zIndex: 2,
  },
  container: {
    display: "flex",
    alignItems: "center",
  },
  textContainer: {
    boxSizing: "border-box" as const,
    display: "flex",
    height: 150,
    backgroundColor: white,
    borderRadius: "0 20px 20px 0",
    padding: 8,
    width: 716,
    overflow: "scroll",
  },
  numberContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 97,
    height: 150,
    borderRadius: "20px 0 0 20px",
  },
  numberText: {
    fontSize: 80,
    color: "white",
  },
  text: {
    fontSize: 28,
    fontWeight: 400,
  },
};
