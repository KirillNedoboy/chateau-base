import type {
  AgingPlanKey,
  ClosureTypeKey,
  GameMoment,
  ProductionVesselKey,
  VineStateKey,
  WineQualityLevel
} from "@chateau/shared";

export type MomentDetectionChoices = {
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
};

export type MomentUserHistory = {
  hasMadeWine: boolean;
  hasPremium: boolean;
  hasGrandCru: boolean;
  hasLegendary: boolean;
  firstGrandCruWithCork: boolean;
  repeatedSafeRuns: boolean;
};

export type MomentWalletContext = {
  walletLinked: boolean;
  baseProfileLinked: boolean;
};

export type DetectMomentsInput = {
  rawQualityScore: number;
  rawQualityLevel: WineQualityLevel;
  finalQualityLevel: WineQualityLevel;
  capApplied: boolean;
  capCause: string | null;
  randomFactor: number;
  choices: MomentDetectionChoices;
  vineState: VineStateKey;
  userHistory: MomentUserHistory;
  wallet: MomentWalletContext;
  storedInCellar: boolean;
};

const RARE_LEVELS: ReadonlySet<WineQualityLevel> = new Set([
  "grand_cru",
  "legendary"
]);

const LEGENDARY_ELIGIBLE_CHOICES: MomentDetectionChoices = {
  productionVessel: "new_oak_barrel",
  agingPlan: "new_to_old_oak_aging",
  closureType: "cork"
};

function usesLegendaryEligibleChoices(choices: MomentDetectionChoices): boolean {
  return (
    choices.productionVessel === LEGENDARY_ELIGIBLE_CHOICES.productionVessel &&
    choices.agingPlan === LEGENDARY_ELIGIBLE_CHOICES.agingPlan &&
    choices.closureType === LEGENDARY_ELIGIBLE_CHOICES.closureType
  );
}

function addMoment(
  moments: GameMoment[],
  moment: GameMoment,
  condition: boolean
): void {
  if (condition) {
    moments.push(moment);
  }
}

export function detectMoments(input: DetectMomentsInput): GameMoment[] {
  const moments: GameMoment[] = [];

  addMoment(moments, "first_wine", !input.userHistory.hasMadeWine);
  addMoment(
    moments,
    "first_premium",
    input.finalQualityLevel === "premium" && !input.userHistory.hasPremium
  );
  addMoment(
    moments,
    "first_grand_cru",
    input.finalQualityLevel === "grand_cru" && !input.userHistory.hasGrandCru
  );
  addMoment(
    moments,
    "first_legendary",
    input.finalQualityLevel === "legendary" && !input.userHistory.hasLegendary
  );
  addMoment(
    moments,
    "almost_legendary",
    input.rawQualityLevel === "legendary" &&
      input.finalQualityLevel !== "legendary" &&
      input.capApplied
  );
  addMoment(
    moments,
    "rng_rugged",
    usesLegendaryEligibleChoices(input.choices) &&
      input.randomFactor < 0 &&
      input.finalQualityLevel === "grand_cru"
  );
  addMoment(
    moments,
    "corkfather",
    RARE_LEVELS.has(input.finalQualityLevel) &&
      input.choices.closureType === "cork" &&
      input.userHistory.firstGrandCruWithCork
  );
  addMoment(
    moments,
    "screw_cap_criminal",
    input.capCause === "screw_cap" || input.choices.closureType === "screw_cap"
  );
  addMoment(
    moments,
    "paper_hands",
    RARE_LEVELS.has(input.finalQualityLevel) && !input.storedInCellar
  );
  addMoment(
    moments,
    "gas_station_vintage",
    input.choices.productionVessel === "steel_tank" &&
      input.choices.agingPlan === "no_aging" &&
      input.choices.closureType === "screw_cap"
  );
  addMoment(
    moments,
    "based_vintage",
    input.vineState === "low_yield" &&
      usesLegendaryEligibleChoices(input.choices) &&
      input.wallet.walletLinked &&
      input.wallet.baseProfileLinked &&
      input.storedInCellar
  );
  addMoment(
    moments,
    "risk_free_peasant",
    input.choices.productionVessel === "steel_tank" &&
      input.choices.agingPlan === "no_aging" &&
      input.choices.closureType !== "cork" &&
      input.userHistory.repeatedSafeRuns
  );

  return moments;
}
