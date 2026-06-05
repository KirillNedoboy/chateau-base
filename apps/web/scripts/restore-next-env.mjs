import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const nextEnvPath = join(scriptDir, "..", "next-env.d.ts");

writeFileSync(
  nextEnvPath,
  [
    '/// <reference types="next" />',
    '/// <reference types="next/image-types/global" />',
    "",
    "// NOTE: This file should not be edited",
    "// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.",
    ""
  ].join("\n")
);
