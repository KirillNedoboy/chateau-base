export const BASE_SEPOLIA_CHAIN_ID = 84532;

export type BaseSepoliaDeploymentConfig = {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  chateauCellarAddress: string;
  deployerAddress: string;
  deploymentTxHash: string | null;
};

export const BASE_SEPOLIA_DEPLOYMENT_PLACEHOLDERS: BaseSepoliaDeploymentConfig = {
  chainId: BASE_SEPOLIA_CHAIN_ID,
  chainName: "base-sepolia",
  rpcUrl: "https://sepolia.base.org",
  blockExplorerUrl: "https://sepolia.basescan.org",
  chateauCellarAddress: "0x0000000000000000000000000000000000000000",
  deployerAddress: "0x0000000000000000000000000000000000000000",
  deploymentTxHash: null
};
