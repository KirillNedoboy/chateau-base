export type ReferralChallengeStatus =
  | "opened"
  | "started"
  | "completed_first_wine"
  | "beat_score"
  | "failed";

export type ReferralChallenge = {
  id: string;
  inviterUserId: string;
  invitedUserId: string | null;
  sourceShareId: string;
  sourceBatchId: string | null;
  status: ReferralChallengeStatus;
  inviterScore: number | null;
  invitedScore: number | null;
  createdAt: string;
  completedAt: string | null;
};
