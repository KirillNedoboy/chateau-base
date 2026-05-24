export type GameActionType =
  | "session_start"
  | "shop_buy"
  | "vine_plant"
  | "vine_harvest"
  | "winery_preview"
  | "winery_craft"
  | "wine_sell"
  | "wine_store"
  | "share_create"
  | "challenge_open"
  | "challenge_start"
  | "challenge_complete"
  | "wallet_link"
  | "analytics_event";

export type GameActionLog = {
  id: string;
  userId: string;
  actionType: GameActionType;
  idempotencyKey: string;
  requestPayload: unknown;
  responsePayload: unknown;
  createdAt: string;
};
