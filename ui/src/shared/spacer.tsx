import {Box} from "@mui/material";

type Props = {
    size?: number
}

export const Spacer = ({size = 24}: Props) => (
    <Box sx={{height: size, width: size}}/>
)