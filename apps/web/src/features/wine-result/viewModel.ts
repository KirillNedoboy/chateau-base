import type { WineCraftResponse } from "../../lib/api";
import { formatKey } from "../game-ui/viewModels";

export type WineResultSection = {
  title: string;
  values: string[];
};

function formatProfileEntry(key: string, value: number): string {
  return `${formatKey(key)} ${value}`;
}

export function formatMoment(moment: string): string {
  return formatKey(moment);
}

export function getWineResultSections(result: WineCraftResponse): WineResultSection[] {
  return [
    {
      title: "Wine DNA",
      values: Object.entries(result.profile).map(([key, value]) =>
        formatProfileEntry(key, value)
      )
    },
    {
      title: "Style Tags",
      values: result.styleTags.length > 0 ? result.styleTags.map(formatKey) : ["None"]
    },
    {
      title: "Production",
      values: [
        formatKey(result.productionVessel),
        formatKey(result.agingPlan),
        formatKey(result.closureType),
        `${result.grapeAmount} grapes`
      ]
    },
    {
      title: "Moments",
      values:
        result.moments.length > 0 ? result.moments.map(formatMoment) : ["No moment"]
    }
  ];
}
