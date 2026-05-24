export function calculateBottleCount(grapeAmount: number): number {
  return Math.max(1, Math.floor(grapeAmount / 2));
}
