export const BASE_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

const EVM_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const SUPPORTED_BASE_CHAIN_IDS = [
  BASE_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID
] as const;

export type SupportedBaseChainId = (typeof SUPPORTED_BASE_CHAIN_IDS)[number];

export function isSupportedBaseChainId(
  chainId: number
): chainId is SupportedBaseChainId {
  return SUPPORTED_BASE_CHAIN_IDS.includes(chainId as SupportedBaseChainId);
}

export function isUsableContractAddress(address: string | null | undefined): boolean {
  if (!address) {
    return false;
  }

  const normalized = address.trim().toLowerCase();
  return EVM_ADDRESS_PATTERN.test(normalized) && normalized !== ZERO_ADDRESS;
}

export function getChateauCellarAddress(
  chainId: SupportedBaseChainId
): string | null {
  const configured =
    chainId === BASE_CHAIN_ID
      ? process.env.CHATEAU_CELLAR_BASE_ADDRESS
      : process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
  const normalized = configured?.trim().toLowerCase();

  return isUsableContractAddress(normalized) ? normalized ?? null : null;
}
