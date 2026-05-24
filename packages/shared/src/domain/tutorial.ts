export type TutorialStatus = "not_started" | "in_progress" | "completed";

export type TutorialStep =
  | "session_started"
  | "shop_opened"
  | "vine_bought"
  | "vine_planted"
  | "vine_harvested"
  | "winery_opened"
  | "production_started"
  | "wine_revealed"
  | "wallet_prompt_seen";

export type TutorialState = {
  status: TutorialStatus;
  currentStep: TutorialStep | null;
  completedSteps: TutorialStep[];
  firstWineBatchId: string | null;
  firstWineRevealedAt: string | null;
  violenceModePromptedAt: string | null;
  updatedAt: string;
};
