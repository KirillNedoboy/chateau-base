import type { FastifyInstance } from "fastify";
import { z } from "zod";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema)
  ])
);

type ParseWithZod = <TSchema extends z.ZodType<unknown>>(
  schema: TSchema,
  input: unknown
) => z.output<TSchema>;

declare module "fastify" {
  interface FastifyInstance {
    parseWithZod: ParseWithZod;
  }
}

type RequestValidationError = Error & {
  statusCode: number;
  code: "REQUEST_VALIDATION_ERROR";
  details: z.ZodIssue[];
};

export function registerZodValidation(server: FastifyInstance): void {
  const parseWithZod: ParseWithZod = (schema, input) => {
    const parsed = schema.safeParse(input);
    if (parsed.success) {
      return parsed.data;
    }

    const error = new Error("Request validation failed") as RequestValidationError;
    error.statusCode = 400;
    error.code = "REQUEST_VALIDATION_ERROR";
    error.details = parsed.error.issues;
    throw error;
  };

  server.decorate("parseWithZod", parseWithZod);
}
