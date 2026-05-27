export { prisma } from "./client.js";
export { default } from "./client.js";

export const dbPackage = {
  name: "@chateau/db",
  scope: "prisma"
} as const;
