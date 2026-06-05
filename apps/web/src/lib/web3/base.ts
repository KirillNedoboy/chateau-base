export const BASE_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const BASE_CHAIN_OPTIONS = {
  [BASE_CHAIN_ID]: {
    chainId: BASE_CHAIN_ID,
    chainIdHex: "0x2105",
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorerUrl: "https://basescan.org"
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    chainId: BASE_SEPOLIA_CHAIN_ID,
    chainIdHex: "0x14a34",
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorerUrl: "https://sepolia.basescan.org"
  }
} as const;

export const REOWN_APPKIT_PLACEHOLDER = {
  projectIdEnv: "NEXT_PUBLIC_REOWN_PROJECT_ID",
  coinbaseWalletSupported: true
} as const;

export function isSupportedBaseChainId(chainId: number): boolean {
  return chainId === BASE_CHAIN_ID || chainId === BASE_SEPOLIA_CHAIN_ID;
}

export function parseWalletChainId(chainId: string): number {
  if (chainId.startsWith("0x")) {
    return Number.parseInt(chainId, 16);
  }
  return Number(chainId);
}

export function normalizeWalletAddress(walletAddress: string): `0x${string}` {
  const normalized = walletAddress.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
    throw new Error("Invalid wallet address");
  }
  return normalized as `0x${string}`;
}
