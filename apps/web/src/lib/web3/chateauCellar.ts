import { chateauCellarAbi } from "@chateau/contracts/abi/chateauCellarAbi";
import { encodeFunctionData } from "viem";
import type { PreservePrepareResponse } from "../api";

const EVM_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type EthereumProvider = {
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
};

function normalizeContractAddress(contractAddress: unknown): `0x${string}` {
  if (typeof contractAddress !== "string") {
    throw new Error("Invalid ChateauCellar contract address");
  }

  const normalized = contractAddress.trim().toLowerCase();
  if (!EVM_ADDRESS_PATTERN.test(normalized) || normalized === ZERO_ADDRESS) {
    throw new Error("Invalid ChateauCellar contract address");
  }

  return normalized as `0x${string}`;
}

export function encodePreserveVintageCalldata(
  payload: PreservePrepareResponse
): `0x${string}` {
  return encodeFunctionData({
    abi: chateauCellarAbi,
    functionName: "preserveVintage",
    args: [
      payload.batchHash,
      payload.metadataUri,
      payload.qualityLevel,
      payload.primaryMoment,
      payload.seasonKey,
      payload.score
    ]
  });
}

export async function sendPreserveVintageTransaction({
  provider,
  from,
  payload
}: {
  provider: EthereumProvider;
  from: `0x${string}`;
  payload: PreservePrepareResponse;
}): Promise<`0x${string}`> {
  const contractAddress = normalizeContractAddress(payload.contractAddress);
  const txHash = await provider.request<string>({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: contractAddress,
        data: encodePreserveVintageCalldata(payload)
      }
    ]
  });

  return txHash as `0x${string}`;
}
