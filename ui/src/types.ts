/**
 * Temporary, we expect the protobufs to generate types.
 *
 * These are here to facilitate mocking.
 */

export type Votes = {
    QuestionNumber: number;
    ParticipantAnswers: Array<number>;
    ParticipantName: string;
    ParticipantHat: string;
}

export type UpdateResultsMessage = {
    RoomCode: string;
    Game: string;
    Votes: Array<Votes>;
    Participants: Array<string>;
    AudienceList: Array<string>;
    VotingClosed: boolean;
    VotingStarted: boolean;
    VotingStartTime: string;
    VotingEndTime: string;
    TimedDuration: string;
    DurationRemaining: string;
    Error: string | null;
}