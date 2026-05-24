export type GameEventName =
  | "session_started"
  | "tutorial_started"
  | "shop_opened"
  | "vine_bought"
  | "vine_planted"
  | "vine_harvested"
  | "winery_opened"
  | "production_preview_seen"
  | "production_started"
  | "wine_revealed"
  | "moment_triggered"
  | "result_shared"
  | "run_it_back_clicked"
  | "wine_sold"
  | "wallet_prompt_seen"
  | "wallet_connected"
  | "challenge_opened"
  | "challenge_started"
  | "challenge_completed"
  | "violence_mode_enabled";

export type GameEvent = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  name: GameEventName;
  payload: Record<string, unknown>;
  createdAt: string;
};
