import type { Prisma } from "@prisma/client";
import type { TutorialState, TutorialStep } from "@chateau/shared";
import { z } from "zod";

const tutorialStateSchema = z.object({
  status: z.union([
    z.literal("not_started"),
    z.literal("in_progress"),
    z.literal("completed")
  ]),
  currentStep: z
    .union([
      z.literal("session_started"),
      z.literal("shop_opened"),
      z.literal("vine_bought"),
      z.literal("vine_planted"),
      z.literal("vine_harvested"),
      z.literal("winery_opened"),
      z.literal("production_started"),
      z.literal("wine_revealed"),
      z.literal("wallet_prompt_seen")
    ])
    .nullable(),
  completedSteps: z.array(
    z.union([
      z.literal("session_started"),
      z.literal("shop_opened"),
      z.literal("vine_bought"),
      z.literal("vine_planted"),
      z.literal("vine_harvested"),
      z.literal("winery_opened"),
      z.literal("production_started"),
      z.literal("wine_revealed"),
      z.literal("wallet_prompt_seen")
    ])
  ),
  firstWineBatchId: z.string().nullable(),
  firstWineRevealedAt: z.string().nullable(),
  violenceModePromptedAt: z.string().nullable(),
  updatedAt: z.string()
});

export function createInitialTutorialState(): TutorialState {
  return {
    status: "not_started",
    currentStep: "session_started",
    completedSteps: ["session_started"],
    firstWineBatchId: null,
    firstWineRevealedAt: null,
    violenceModePromptedAt: null,
    updatedAt: new Date().toISOString()
  };
}

export function resolveTutorialState(input: unknown): TutorialState {
  const parsed = tutorialStateSchema.safeParse(input);
  if (!parsed.success) {
    return createInitialTutorialState();
  }

  return parsed.data;
}

export function advanceTutorialState(
  input: unknown,
  steps: TutorialStep[]
): Prisma.InputJsonValue {
  const current = resolveTutorialState(input);
  const completedSteps = new Set<TutorialStep>(current.completedSteps);

  for (const step of steps) {
    completedSteps.add(step);
  }

  return {
    ...current,
    status: current.status === "completed" ? "completed" : "in_progress",
    currentStep: steps.at(-1) ?? current.currentStep,
    completedSteps: Array.from(completedSteps),
    updatedAt: new Date().toISOString()
  } satisfies TutorialState as Prisma.InputJsonValue;
}

export function isTutorialActive(input: unknown): boolean {
  return resolveTutorialState(input).status !== "completed";
}
