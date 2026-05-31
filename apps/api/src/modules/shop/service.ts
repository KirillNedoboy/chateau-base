import { DEFAULT_GAME_CONFIG } from "@chateau/game-engine";
import type { ShopItemKey } from "@chateau/shared";
import type { ApiPrismaClient } from "../../plugins/prisma.js";
import { advanceTutorialState } from "../tutorial/state.js";

const SHOP_ITEM_TO_DB_KEY = {
  vine: "VINE",
  screw_cap: "SCREW_CAP",
  cork: "CORK",
  steel_tank_unlock: "STEEL_TANK_UNLOCK",
  old_oak_barrel_unlock: "OLD_OAK_BARREL_UNLOCK",
  new_oak_barrel_unlock: "NEW_OAK_BARREL_UNLOCK",
  new_plot: "NEW_PLOT"
} as const;

type ShopBuyInput = {
  prisma: ApiPrismaClient;
  userId: string;
  itemKey: ShopItemKey;
  quantity: number;
};

type ShopBuyResult = {
  userId: string;
  itemKey: ShopItemKey;
  quantity: number;
  totalCost: number;
  grapeBalance: number;
};

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

export async function buyShopItem({
  prisma,
  userId,
  itemKey,
  quantity
}: ShopBuyInput): Promise<ShopBuyResult> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const unitPrice = DEFAULT_GAME_CONFIG.shopPrices[itemKey];
    const totalCost = unitPrice * quantity;

    if (user.grapeBalance < totalCost) {
      throw createHttpError(409, "Insufficient GRAPE balance");
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        grapeBalance: {
          decrement: totalCost
        },
        tutorialState: advanceTutorialState(user.tutorialState, [
          "shop_opened",
          "vine_bought"
        ])
      }
    });

    if (itemKey === "new_plot") {
      const existingPlots = await tx.plot.findMany({
        where: { userId },
        orderBy: { index: "asc" }
      });
      const highestIndex = existingPlots.at(-1)?.index ?? 0;

      for (let indexOffset = 1; indexOffset <= quantity; indexOffset += 1) {
        await tx.plot.create({
          data: {
            userId,
            index: highestIndex + indexOffset
          }
        });
      }
    } else {
      await tx.inventory.upsert({
        where: {
          userId_itemKey: {
            userId,
            itemKey: SHOP_ITEM_TO_DB_KEY[itemKey]
          }
        },
        update: {
          quantity: {
            increment: quantity
          }
        },
        create: {
          userId,
          itemKey: SHOP_ITEM_TO_DB_KEY[itemKey],
          quantity
        }
      });
    }

    const updatedUser = await tx.user.findUnique({
      where: { id: userId }
    });

    await tx.gameEvent.create({
      data: {
        userId,
        sessionId: null,
        name: "vine_bought",
        payload: {
          itemKey,
          quantity,
          totalCost,
          grapeBalance: updatedUser?.grapeBalance ?? user.grapeBalance - totalCost
        }
      }
    });

    return {
      userId,
      itemKey,
      quantity,
      totalCost,
      grapeBalance: updatedUser?.grapeBalance ?? user.grapeBalance - totalCost
    };
  });
}
