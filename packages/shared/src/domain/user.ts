import type { TutorialState } from "./tutorial.js";

export type ChateauLevel = 1 | 2 | 3;

export type User = {
  id: string;
  telegramUserId: string | null;
  walletAddress: string | null;
  chainId: number | null;
  baseProfileLinked: boolean;
  grapeBalance: number;
  chateauLevel: ChateauLevel;
  tutorialState: TutorialState;
  sommelierViolenceEnabled: boolean;
  cowardMeter: number;
  createdAt: string;
  updatedAt: string;
};
