import { Box, List, Typography } from "@mui/material";
import { eggplant, white } from "../shared/colors";
import React, { useContext } from "react";
import check from "../images/poll-battle-components/checked-icon.svg";
import faceIcon from "../images/poll-battle-components/face-2-white.svg";
import { GameStateContext } from "../game-state-provider";

enum ParticipantStatus {
  PENDING = "PENDING",
  VOTED = "VOTED",
}

type Props = {
  height?: string;
  countType?: "participant" | "vote";
  width?: string;
  participantTextFontSize?: string;
  showFaceOnly?: boolean;
};

export const Participants = ({
  height = "624px",
  width = "350px",
  countType,
  participantTextFontSize,
  showFaceOnly,
}: Props) => {
  const { gameState } = useContext(GameStateContext);
  console.log(gameState)
  const votedParticipants = gameState.Votes.map((v) => v.ParticipantName);
  const participantStatuses = gameState.Participants.map((p) => {
    return {
      name: p,
      status: votedParticipants.includes(p)
        ? ParticipantStatus.VOTED
        : ParticipantStatus.PENDING,
    };
  });
  const containerStyle = {
    ...styles.container,
    height,
    width,
  };

  return (
    <Box sx={containerStyle}>
      {countType && (
        <Typography variant="body1" sx={styles.count}>
          {countType === "vote"
            ? `${votedParticipants.length} / ${participantStatuses.length} voted`
            : `${participantStatuses.length} participants`}
        </Typography>
      )}
      <List
        sx={[
          styles.participantList,
          {
            height: height
              ? `calc(${height} - 40px)` // Adjust height to account for other elements
              : countType
              ? "520px"
              : "580px",
          },
        ]}
      >
        {participantStatuses.map((participant, index) => (
          <Box key={index} sx={styles.participantContainer}>
            {countType === "vote" && (
              <img
                src={
                  participant.status === ParticipantStatus.VOTED
                    ? check
                    : faceIcon
                }
                alt="Check icon"
                height={"30px"}
              />
            )}
            {showFaceOnly && (
              <img src={faceIcon} alt="Face icon" height={"30px"} />
            )}
            <Typography
              variant="body1"
              style={{
                ...styles.participantText,
                fontSize: participantTextFontSize,
              }}
            >
              {participant.name}
            </Typography>
          </Box>
        ))}
      </List>
    </Box>
  );
};

const styles = {
  container: {
    backgroundColor: eggplant,
    borderRadius: "20px",
    boxSizing: "border-box",
    padding: "8px 24px",
    height: "624px",
    width: "350px",
  },
  participantContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  participantText: {
    color: white,
    fontSize: "24px",
  },
  count: {
    color: white,
    fontSize: "42px",
  },
  participantList: {
    overflowY: "scroll",
  },
};
