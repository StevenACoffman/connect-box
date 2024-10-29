import React from "react";
import {Box} from "@mui/material";
import pollBattleBackground from "../images/poll-battle-components/poll-battle-background.svg";

type Props = {
    children: React.ReactNode;
}
export const DefaultPageWrapper = ({children}: Props) => {
    return (
        <Box sx={styles.wrapper}>
            {children}
        </Box>
    )
}

const styles = {
    wrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${pollBattleBackground})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
    }
}