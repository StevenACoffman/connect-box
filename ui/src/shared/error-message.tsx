import { Box, Typography } from "@mui/material";
import errorIcon from "../images/poll-battle-components/error-icon.svg";
import { errorRed } from "./colors";

type Props = {
  big?: boolean;
};

export const ErrorMessage = ({ big = false }: Props) => {
  const textStyle = big ? styles.bigText : styles.text;

  return (
    <Box sx={styles.wrapper}>
      <img src={errorIcon} alt="error" height={big ? "80px" : "40px"} />
      <Typography sx={textStyle}>
        Oops! Something isn't working. Please try again.
      </Typography>
    </Box>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  text: {
    color: errorRed,
    fontSize: "24px",
  },
  bigText: {
    color: errorRed,
    fontSize: "62px",
  },
};
