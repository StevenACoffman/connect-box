import enterCodeSvg from "../images/enter-code.svg";
import {Spacer} from "../shared/spacer";
import React, {useContext} from "react";
import {DefaultPageWrapper} from "../shared/default-page-wrapper";
import {CustomTextInput} from "../shared/custom-text-input";
import {GameStateContext} from "../game-state-provider";
import {PollBattleButton} from "../shared/poll-battle-button";
import {Box} from "@mui/material";
import enterNameSvg from "../images/enter-name.svg";
import {useNavigate} from "react-router-dom";
import {ErrorMessage} from "../shared/error-message";
import {PollUpdateContext} from "../poll-update-provider";
import {
    ParticipantAudienceJoinEventMessage,
    PollService,
    SubscribeRequestMessage
} from "../proto/server/poll/v1/poll_pb";
import {useClient} from "../useClient";

export const JoinRoomPage = () => {
    const navigate = useNavigate();
    const {room, setRoom, setNickname} = React.useContext(GameStateContext);
    const [name, setName] = React.useState("");
    const [code, setCode] = React.useState(room);
    const [loading, setLoading] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const client = useClient(PollService);
    const pollUpdate = useContext(PollUpdateContext);

    const submit = async () => {
        setLoading(true);
        try {
            const resp = await client.participantAudienceJoinRequest({
                RoomCode: code,
                Game: "PollBattle",
                Nickname: name,
                Participant: true,
                Audience: false,
            } as ParticipantAudienceJoinEventMessage);

            if (!resp.updateResultsMessage?.RoomCode) {
                throw new Error("No room code in response");
            }
            // Fire off the subscribe request asynchronously, the provider will
            // update the game state.
            pollUpdate.subscribeRequest({
                RoomCode: resp.updateResultsMessage.RoomCode,
            } as SubscribeRequestMessage);
            // Navigate to the waiting room
            setRoom(resp.updateResultsMessage.RoomCode);
            setNickname(name);

            navigate("/apps/poll-battle/waiting-room");
        } catch (err) {
            setHasError(true);
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DefaultPageWrapper>
            <Box sx={styles.enterBoxes}>
                <Box sx={styles.wrapper}>
                    <img
                        style={styles.enterCodeOrName}
                        src={enterCodeSvg}
                        alt="enter-code"
                    />
                    <Spacer/>
                    <CustomTextInput
                        styles={styles.codeText}
                        value={code}
                        onChange={(newCode) => {
                            if (newCode.length <= 4) {
                                setCode(newCode);
                            }
                        }}
                        uppercase={true}
                        fontSize={154}
                        overflow="hidden"
                    />
                    <Spacer/>
                </Box>
                <Spacer/>
                <Box sx={styles.wrapper}>
                    <img
                        style={styles.enterCodeOrName}
                        src={enterNameSvg}
                        alt="enter-name"
                    />
                    <Spacer/>
                    <CustomTextInput
                        styles={styles.nameText}
                        value={name}
                        onChange={setName}
                        uppercase={false}
                        fontSize={105}
                        overflow="hidden"
                    />
                    <Spacer/>
                </Box>
            </Box>
            <Spacer/>
            <PollBattleButton
                disabled={code.length !== 4 || name.length < 1 || loading}
                onClick={submit}
                styles={styles.button}
            >
                Enter PollBattle
            </PollBattleButton>
            {hasError && <ErrorMessage/>}
        </DefaultPageWrapper>
    );
};

const styles = {
    wrapper: {
        display: "flex",
    },
    enterCodeOrName: {
        height: "87px",
        width: "300px",
    },
    codeText: {
        width: "675px",
        height: "168px",
    },
    nameText: {
        width: "1000px",
        height: "168px",
    },
    enterBoxes: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "flex-start",
        justifyContent: "flex-start",
    },
    button: {
        width: "473px",
        height: "111px",
    },
};
