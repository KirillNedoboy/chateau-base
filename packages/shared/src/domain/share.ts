export type ShareObjectType =
  | "wine_result"
  | "fumble"
  | "achievement"
  | "challenge"
  | "coward_meter"
  | "corkfather"
  | "legendary";

export type ShareMode = "classy" | "degen";

export type ShareObject = {
  id: string;
  userId: string;
  batchId: string | null;
  type: ShareObjectType;
  mode: ShareMode;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string | null;
  deeplinkUrl: string;
  payload: Record<string, unknown>;
  createdAt: string;
};
