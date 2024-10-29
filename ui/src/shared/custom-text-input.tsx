import { TextField } from "@mui/material";
import React from "react";
import { formWidth } from "./constants";
import { white } from "./colors";

type Props = {
  multiline?: boolean;
  value: string;
  onChange: (newValue: string) => void;
  uppercase: boolean;
  fontSize: number;
  placeholder?: string;
  styles?: any;
  overflow?: string;
};

export const CustomTextInput = ({
  multiline = false,
  value,
  onChange,
  fontSize,
  styles,
  uppercase = false,
  placeholder = "",
  overflow,
}: Props) => {
  return (
    <TextField
      multiline={multiline}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="standard"
      sx={{
        ...{
          ...internalStyles.textField,
          "& input": {
            ...internalStyles.textField["& input"],
            textTransform: uppercase ? "uppercase" : "none",
            fontSize: `${fontSize}px`,
          },
        },
        ...styles,
      }}
      InputProps={{
        disableUnderline: true,
        style: { fontSize: `${fontSize}px`, overflow: overflow ?? "scroll" },
      }}
      placeholder={placeholder}
    />
  );
};

const internalStyles = {
  textField: {
    width: `${formWidth}px`,
    height: "258px",
    backgroundColor: white,
    borderRadius: "30px",
    padding: "24px",
    "& input": {
      border: "none",
      fontSize: "170px",
      textTransform: "uppercase",
    },
  },
};
