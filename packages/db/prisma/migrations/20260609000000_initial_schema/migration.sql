-- CreateEnum
CREATE TYPE "ChateauLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

-- CreateEnum
CREATE TYPE "SeasonKey" AS ENUM ('genesis_harvest', 'tuscany', 'bordeaux', 'napa', 'georgia_qvevri', 'champagne');

-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('empty', 'planted', 'ready_to_harvest');

-- CreateEnum
CREATE TYPE "VineStateKey" AS ENUM ('low_yield', 'balanced', 'overcropped');

-- CreateEnum
CREATE TYPE "ShopItemKey" AS ENUM ('grape', 'vine', 'screw_cap', 'cork', 'steel_tank_unlock', 'old_oak_barrel_unlock', 'new_oak_barrel_unlock', 'new_plot');

-- CreateEnum
CREATE TYPE "WineQualityLevel" AS ENUM ('common', 'good', 'premium', 'grand_cru', 'legendary');

-- CreateEnum
CREATE TYPE "ProductionVesselKey" AS ENUM ('steel_tank', 'old_oak_barrel', 'new_oak_barrel');

-- CreateEnum
CREATE TYPE "AgingPlanKey" AS ENUM ('no_aging', 'short_old_oak_aging', 'new_oak_aging', 'new_to_old_oak_aging');

-- CreateEnum
CREATE TYPE "ClosureTypeKey" AS ENUM ('screw_cap', 'cork');

-- CreateEnum
CREATE TYPE "WineBatchStatus" AS ENUM ('revealed', 'stored', 'sold');

-- CreateEnum
CREATE TYPE "ShareObjectType" AS ENUM ('wine_result', 'fumble', 'achievement', 'challenge', 'coward_meter', 'corkfather', 'legendary');

-- CreateEnum
CREATE TYPE "ShareMode" AS ENUM ('classy', 'degen');

-- CreateEnum
CREATE TYPE "ReferralChallengeStatus" AS ENUM ('opened', 'started', 'completed_first_wine', 'beat_score', 'failed');

-- CreateEnum
CREATE TYPE "OnchainEventType" AS ENUM ('vintage_preserved', 'challenge_result_recorded', 'based_winemaker_claimed');

-- CreateEnum
CREATE TYPE "OnchainEventStatus" AS ENUM ('pending', 'confirmed', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT,
    "walletAddress" TEXT,
    "chainId" INTEGER,
    "baseProfileLinked" BOOLEAN NOT NULL DEFAULT false,
    "grapeBalance" INTEGER NOT NULL DEFAULT 500,
    "chateauLevel" "ChateauLevel" NOT NULL DEFAULT 'LEVEL_1',
    "tutorialState" JSONB,
    "sommelierViolenceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cowardMeter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "key" "SeasonKey" NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "status" "PlotStatus" NOT NULL DEFAULT 'empty',
    "vineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "harvestCount" INTEGER NOT NULL DEFAULT 0,
    "state" "VineStateKey" NOT NULL DEFAULT 'low_yield',
    "plantedAt" TIMESTAMP(3) NOT NULL,
    "readyAt" TIMESTAMP(3) NOT NULL,
    "lastHarvestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemKey" "ShopItemKey" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WineBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "seasonKey" "SeasonKey" NOT NULL,
    "gameConfigVersion" TEXT NOT NULL,
    "batchHash" TEXT NOT NULL,
    "metadataUri" TEXT,
    "onchainEligible" BOOLEAN NOT NULL DEFAULT false,
    "preservedOnchain" BOOLEAN NOT NULL DEFAULT false,
    "preserveTxHash" TEXT,
    "preserveChainId" INTEGER,
    "preservedAt" TIMESTAMP(3),
    "qualityLevel" "WineQualityLevel" NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "rawQualityScore" INTEGER NOT NULL,
    "rawQualityLevel" "WineQualityLevel" NOT NULL,
    "capApplied" BOOLEAN NOT NULL DEFAULT false,
    "capAppliedLevel" "WineQualityLevel",
    "capCause" TEXT,
    "productionVessel" "ProductionVesselKey" NOT NULL,
    "agingPlan" "AgingPlanKey" NOT NULL,
    "closureType" "ClosureTypeKey" NOT NULL,
    "vineState" "VineStateKey" NOT NULL,
    "grapeAmount" INTEGER NOT NULL,
    "bottleCount" INTEGER NOT NULL,
    "profile" JSONB,
    "styleTags" JSONB,
    "label" JSONB,
    "moments" JSONB,
    "primaryMoment" TEXT,
    "verdict" JSONB,
    "nftReadyMetadata" JSONB,
    "recipe" JSONB,
    "salePrice" INTEGER,
    "status" "WineBatchStatus" NOT NULL DEFAULT 'revealed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "storedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WineBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareObject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" "ShareObjectType" NOT NULL,
    "mode" "ShareMode" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "deeplinkUrl" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralChallenge" (
    "id" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "sourceShareId" TEXT NOT NULL,
    "sourceBatchId" TEXT,
    "status" "ReferralChallengeStatus" NOT NULL DEFAULT 'opened',
    "inviterScore" INTEGER,
    "invitedScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productionVessel" "ProductionVesselKey" NOT NULL,
    "agingPlan" "AgingPlanKey" NOT NULL,
    "closureType" "ClosureTypeKey" NOT NULL,
    "vineState" "VineStateKey" NOT NULL,
    "timesUsed" INTEGER NOT NULL DEFAULT 1,
    "bestScore" INTEGER NOT NULL,
    "bestQualityLevel" "WineQualityLevel" NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cellar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedSlots" INTEGER NOT NULL DEFAULT 0,
    "maxSlots" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cellar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnchainEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "eventType" "OnchainEventType" NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "batchId" TEXT,
    "challengeId" TEXT,
    "status" "OnchainEventStatus" NOT NULL DEFAULT 'pending',
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "OnchainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramUserId_key" ON "User"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Season_key_key" ON "Season"("key");

-- CreateIndex
CREATE INDEX "Season_isActive_idx" ON "Season"("isActive");

-- CreateIndex
CREATE INDEX "Plot_userId_status_idx" ON "Plot"("userId", "status");

-- CreateIndex
CREATE INDEX "Plot_vineId_idx" ON "Plot"("vineId");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_userId_index_key" ON "Plot"("userId", "index");

-- CreateIndex
CREATE INDEX "Vine_userId_readyAt_idx" ON "Vine"("userId", "readyAt");

-- CreateIndex
CREATE INDEX "Vine_plotId_createdAt_idx" ON "Vine"("plotId", "createdAt");

-- CreateIndex
CREATE INDEX "Inventory_userId_updatedAt_idx" ON "Inventory"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_userId_itemKey_key" ON "Inventory"("userId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "WineBatch_batchHash_key" ON "WineBatch"("batchHash");

-- CreateIndex
CREATE INDEX "WineBatch_userId_createdAt_idx" ON "WineBatch"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WineBatch_seasonId_qualityLevel_idx" ON "WineBatch"("seasonId", "qualityLevel");

-- CreateIndex
CREATE INDEX "WineBatch_batchHash_idx" ON "WineBatch"("batchHash");

-- CreateIndex
CREATE INDEX "WineBatch_preserveTxHash_idx" ON "WineBatch"("preserveTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "ShareObject_deeplinkUrl_key" ON "ShareObject"("deeplinkUrl");

-- CreateIndex
CREATE INDEX "ShareObject_userId_createdAt_idx" ON "ShareObject"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareObject_batchId_idx" ON "ShareObject"("batchId");

-- CreateIndex
CREATE INDEX "ReferralChallenge_sourceBatchId_idx" ON "ReferralChallenge"("sourceBatchId");

-- CreateIndex
CREATE INDEX "ReferralChallenge_inviterUserId_createdAt_idx" ON "ReferralChallenge"("inviterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralChallenge_invitedUserId_idx" ON "ReferralChallenge"("invitedUserId");

-- CreateIndex
CREATE INDEX "ReferralChallenge_status_idx" ON "ReferralChallenge"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralChallenge_sourceShareId_key" ON "ReferralChallenge"("sourceShareId");

-- CreateIndex
CREATE INDEX "RecipeHistory_userId_lastUsedAt_idx" ON "RecipeHistory"("userId", "lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeHistory_userId_productionVessel_agingPlan_closureType_key" ON "RecipeHistory"("userId", "productionVessel", "agingPlan", "closureType", "vineState");

-- CreateIndex
CREATE UNIQUE INDEX "Cellar_userId_key" ON "Cellar"("userId");

-- CreateIndex
CREATE INDEX "GameActionLog_userId_createdAt_idx" ON "GameActionLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameActionLog_userId_actionType_idempotencyKey_key" ON "GameActionLog"("userId", "actionType", "idempotencyKey");

-- CreateIndex
CREATE INDEX "GameEvent_name_createdAt_idx" ON "GameEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "GameEvent_userId_createdAt_idx" ON "GameEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OnchainEvent_walletAddress_idx" ON "OnchainEvent"("walletAddress");

-- CreateIndex
CREATE INDEX "OnchainEvent_batchId_idx" ON "OnchainEvent"("batchId");

-- CreateIndex
CREATE INDEX "OnchainEvent_challengeId_idx" ON "OnchainEvent"("challengeId");

-- CreateIndex
CREATE INDEX "OnchainEvent_status_createdAt_idx" ON "OnchainEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnchainEvent_chainId_txHash_key" ON "OnchainEvent"("chainId", "txHash");

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vine" ADD CONSTRAINT "Vine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vine" ADD CONSTRAINT "Vine_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WineBatch" ADD CONSTRAINT "WineBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WineBatch" ADD CONSTRAINT "WineBatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareObject" ADD CONSTRAINT "ShareObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareObject" ADD CONSTRAINT "ShareObject_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WineBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralChallenge" ADD CONSTRAINT "ReferralChallenge_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralChallenge" ADD CONSTRAINT "ReferralChallenge_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralChallenge" ADD CONSTRAINT "ReferralChallenge_sourceShareId_fkey" FOREIGN KEY ("sourceShareId") REFERENCES "ShareObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralChallenge" ADD CONSTRAINT "ReferralChallenge_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "WineBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeHistory" ADD CONSTRAINT "RecipeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cellar" ADD CONSTRAINT "Cellar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameActionLog" ADD CONSTRAINT "GameActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnchainEvent" ADD CONSTRAINT "OnchainEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnchainEvent" ADD CONSTRAINT "OnchainEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "WineBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnchainEvent" ADD CONSTRAINT "OnchainEvent_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ReferralChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

