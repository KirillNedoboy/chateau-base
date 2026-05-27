import { PrismaClient, SeasonKey } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.season.upsert({
    where: { key: SeasonKey.GENESIS_HARVEST },
    update: {
      name: "Genesis Harvest",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: null,
      isActive: true
    },
    create: {
      key: SeasonKey.GENESIS_HARVEST,
      name: "Genesis Harvest",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: null,
      isActive: true
    }
  });
}

main()
  .catch((error) => {
    console.error("Prisma seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
