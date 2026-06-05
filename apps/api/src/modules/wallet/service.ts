import type { ApiPrismaClient } from "../../plugins/prisma.js";
import { isSupportedBaseChainId } from "../base/config.js";

const WALLET_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export type WalletLinkResult = {
  userId: string;
  walletAddress: string;
  chainId: number;
  baseProfileLinked: true;
};

export function normalizeWalletAddress(walletAddress: string): string {
  const normalized = walletAddress.trim().toLowerCase();
  if (!WALLET_ADDRESS_PATTERN.test(normalized)) {
    throw createHttpError(400, "Invalid wallet address");
  }
  return normalized;
}

export function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

export async function linkWalletToUser({
  prisma,
  userId,
  walletAddress,
  chainId
}: {
  prisma: ApiPrismaClient;
  userId: string;
  walletAddress: string;
  chainId: number;
}): Promise<WalletLinkResult> {
  if (!isSupportedBaseChainId(chainId)) {
    throw createHttpError(400, "Unsupported Base chain");
  }

  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const existingOwner = await prisma.user.findUnique({
    where: { walletAddress: normalizedWallet }
  });

  if (existingOwner && existingOwner.id !== userId) {
    throw createHttpError(409, "Wallet is already linked to another user");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      walletAddress: normalizedWallet,
      chainId,
      baseProfileLinked: true
    }
  });

  return {
    userId: updated.id,
    walletAddress: updated.walletAddress ?? normalizedWallet,
    chainId: updated.chainId ?? chainId,
    baseProfileLinked: true
  };
}
