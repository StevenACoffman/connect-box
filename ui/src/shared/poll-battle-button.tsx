import { Button } from "@mui/material";
import { buttonMedBlue, white } from "./colors";
import { buttonHeight, buttonFontSize } from "./constants";

type Props = {
  children: string;
  onClick: () => void;
  disabled?: boolean;
  styles?: any;
};

export const PollBattleButton = ({
  children,
  onClick,
  disabled = false,
  styles = {},
}: Props) => {
  return (
    <Button
      sx={{
        ...{
          ...internalStyles.button,
        },
        ...styles,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

const internalStyles = {
  button: {
    backgroundColor: buttonMedBlue,
    color: white,
    border: `8px solid ${white}`,
    borderRadius: "30px",
    width: "100%",
    height: `${buttonHeight}px`,
    fontSize: buttonFontSize,
    textTransform: "none",
  },
};
