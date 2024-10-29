import {Box, Typography} from "@mui/material";
import timeLimitIcon from "../images/poll-battle-components/time-limit.svg";
import {darkGrey} from "./colors";

type Props = {
    duration: string;
}

export const Timer = ({duration}: Props) => {
    return (
        <Box sx={styles.timer}>
            <img src={timeLimitIcon} alt="Time limit icon" width={"40px"} />
            <Box sx={styles.textWrapper}>
                <Typography sx={styles.timerText}>{duration}</Typography>
            </Box>
        </Box>
    )
}

const styles = {
    timer: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "10px",
    },
    textWrapper: {
        width: "150px",
        textAlign: "right",
    },
    timerText: {
        fontSize: "70px",
        color: darkGrey,
    },
}