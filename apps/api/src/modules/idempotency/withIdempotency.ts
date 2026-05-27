import type { GameActionType } from "@chateau/shared";
import { Prisma } from "@prisma/client";
import type { ApiPrismaClient } from "../../plugins/prisma.js";
import type { JsonValue } from "../../plugins/zod.js";

type JsonPayload = Exclude<JsonValue, null>;

type StoredIdempotentResponse = {
  __chateauIdempotencyResult: true;
  data: JsonPayload;
};

export type WithIdempotencyInput<TResult extends JsonPayload> = {
  prisma: ApiPrismaClient;
  userId: string;
  actionType: GameActionType;
  idempotencyKey: string;
  requestPayload: JsonPayload;
  handler: () => Promise<TResult>;
};

function isUniqueConstraintError(error: unknown): error is { code: string } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" && maybeCode === "P2002";
}

function isStoredIdempotentResponse(payload: unknown): payload is StoredIdempotentResponse {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return false;
  }

  const maybeWrapper = payload as {
    __chateauIdempotencyResult?: unknown;
    data?: unknown;
  };

  return (
    maybeWrapper.__chateauIdempotencyResult === true &&
    maybeWrapper.data !== undefined &&
    maybeWrapper.data !== null
  );
}

function unwrapStoredResponse<TResult extends JsonPayload>(payload: unknown): TResult {
  if (isStoredIdempotentResponse(payload)) {
    return payload.data as TResult;
  }

  return payload as TResult;
}

async function waitForStoredResponse<TResult extends JsonPayload>(
  prisma: ApiPrismaClient,
  userId: string,
  actionType: GameActionType,
  idempotencyKey: string
): Promise<TResult> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const existingLog = await prisma.gameActionLog.findUnique({
      where: {
        userId_actionType_idempotencyKey: {
          userId,
          actionType,
          idempotencyKey
        }
      }
    });

    if (existingLog?.responsePayload !== null && existingLog?.responsePayload !== undefined) {
      return unwrapStoredResponse<TResult>(existingLog.responsePayload);
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 25);
    });
  }

  const error = new Error("Idempotent request is still in progress") as Error & {
    statusCode: number;
  };
  error.statusCode = 409;
  throw error;
}

export async function withIdempotency<TResult extends JsonPayload>({
  prisma,
  userId,
  actionType,
  idempotencyKey,
  requestPayload,
  handler
}: WithIdempotencyInput<TResult>): Promise<TResult> {
  const existingLog = await prisma.gameActionLog.findUnique({
    where: {
      userId_actionType_idempotencyKey: {
        userId,
        actionType,
        idempotencyKey
      }
    }
  });

  if (existingLog?.responsePayload !== null && existingLog?.responsePayload !== undefined) {
    return unwrapStoredResponse<TResult>(existingLog.responsePayload);
  }

  let pendingLogId: string;
  const requestPayloadInput = requestPayload as Prisma.InputJsonValue;

  try {
    const pendingLog = await prisma.gameActionLog.create({
      data: {
        userId,
        actionType,
        idempotencyKey,
        requestPayload: requestPayloadInput,
        responsePayload: Prisma.JsonNull
      }
    });
    pendingLogId = pendingLog.id;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    return waitForStoredResponse(prisma, userId, actionType, idempotencyKey);
  }

  let responsePayload: TResult;
  try {
    responsePayload = await handler();
  } catch (error) {
    await prisma.gameActionLog.delete({
      where: { id: pendingLogId }
    });
    throw error;
  }
  const responsePayloadInput = {
    __chateauIdempotencyResult: true,
    data: responsePayload
  } as Prisma.InputJsonObject;

  await prisma.gameActionLog.update({
    where: { id: pendingLogId },
    data: {
      responsePayload: responsePayloadInput
    }
  });

  return responsePayload;
}
