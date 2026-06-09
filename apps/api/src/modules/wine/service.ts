import type { ApiPrismaClient } from "../../plugins/prisma.js";

type SellWineInput = {
  prisma: ApiPrismaClient;
  userId: string;
  batchId: string;
};

export type SellWineResult = {
  batchId: string;
  userId: string;
  status: "sold";
  salePrice: number;
  grapeBalance: number;
  soldAt: string;
};

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

export async function sellWine({
  prisma,
  userId,
  batchId
}: SellWineInput): Promise<SellWineResult> {
  return prisma.$transaction(async (tx) => {
    const [user, batch] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId }
      }),
      tx.wineBatch.findUnique({
        where: { id: batchId }
      })
    ]);

    if (!user) {
      throw createHttpError(404, "User not found");
    }
    if (!batch || batch.userId !== userId) {
      throw createHttpError(404, "WineBatch not found");
    }
    if (batch.status === "SOLD") {
      throw createHttpError(409, "WineBatch is already sold");
    }
    if (batch.status !== "REVEALED") {
      throw createHttpError(409, "WineBatch cannot be sold from current state");
    }
    if (batch.salePrice === null || batch.salePrice <= 0) {
      throw createHttpError(409, "WineBatch cannot be sold");
    }

    const soldAt = new Date();
    const guardedUpdate = await tx.wineBatch.updateMany({
      where: {
        id: batchId,
        userId,
        status: "REVEALED"
      },
      data: {
        status: "SOLD",
        soldAt
      }
    });

    if (guardedUpdate.count !== 1) {
      throw createHttpError(409, "WineBatch cannot be sold from current state");
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        grapeBalance: {
          increment: batch.salePrice
        }
      }
    });

    await tx.gameEvent.create({
      data: {
        userId,
        sessionId: null,
        name: "wine_sold",
        payload: {
          batchId,
          salePrice: batch.salePrice,
          grapeBalance: updatedUser.grapeBalance
        }
      }
    });

    return {
      batchId,
      userId,
      status: "sold",
      salePrice: batch.salePrice,
      grapeBalance: updatedUser.grapeBalance,
      soldAt: soldAt.toISOString()
    };
  });
}
