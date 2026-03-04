import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tanks, barrels, wines, inventory, shopItems, players, grapeInventory } from '../db/schema.js';

const BASE_WINE_PRICE = 40;

// Helper to check blend compatibility (MVP logic: mixing same grape is fine, mixing different ones spoils). 
function isBlendCompatible(slots: any[]): boolean {
    if (slots.length === 0) return true;
    const types = new Set(slots.map(s => s.grapeType));
    // If more than 1 distinct grape type is found in MVP, it's considered incompatible and spoils.
    return types.size <= 1;
}

export async function wineryRoutes(app: FastifyInstance) {
    app.addHook('onRequest', (app as any).authenticate);

    app.get('/', async (request) => {
        const { id: playerId } = request.user as { id: number };
        const now = new Date();

        const playerGrapes = await db.select().from(grapeInventory).where(eq(grapeInventory.playerId, playerId));
        const playerTanks = await db.select().from(tanks).where(eq(tanks.playerId, playerId));
        const playerBarrels = await db.select().from(barrels).where(eq(barrels.playerId, playerId));
        const playerWines = await db.select().from(wines).where(eq(wines.playerId, playerId));

        if (playerTanks.length === 0) {
            const [newTank] = await db.insert(tanks).values({ playerId }).returning();
            playerTanks.push(newTank);
        }

        const enrichedTanks = await Promise.all(playerTanks.map(async (t) => {
            const slots = JSON.parse(t.slots);
            let updatedStatus = t.status;
            let timeRemainingMs = t.readyAt ? Math.max(0, t.readyAt.getTime() - now.getTime()) : null;

            // Scenario A: Check if fermentation finished and apply compatibility check
            if (updatedStatus === 'fermenting' && t.readyAt && t.readyAt <= now) {
                if (!isBlendCompatible(slots)) {
                    updatedStatus = 'spoiled';
                } else {
                    updatedStatus = 'ready';
                }
                await db.update(tanks).set({ status: updatedStatus }).where(eq(tanks.id, t.id));
                timeRemainingMs = 0;
            }

            // Scenario B: Check for Oxidation (spoiled by timeout)
            if (updatedStatus === 'ready' && t.spoilsAt && t.spoilsAt <= now) {
                updatedStatus = 'spoiled';
                await db.update(tanks).set({ status: updatedStatus }).where(eq(tanks.id, t.id));
            }

            return {
                ...t,
                slots,
                status: updatedStatus,
                isReady: updatedStatus === 'ready',
                timeRemainingMs,
                spoilsRemainingMs: t.spoilsAt && updatedStatus === 'ready' ? Math.max(0, t.spoilsAt.getTime() - now.getTime()) : null,
            };
        }));

        const enrichedBarrels = playerBarrels.map((b) => {
            const isReady = b.status === 'aging' && b.readyAt <= now;
            if (isReady && b.status === 'aging') {
                b.status = 'ready';
            }
            return {
                ...b,
                isReady,
                timeRemainingMs: Math.max(0, b.readyAt.getTime() - now.getTime()),
            };
        });

        return { grapeInventory: playerGrapes, tanks: enrichedTanks, barrels: enrichedBarrels, wines: playerWines };
    });

    app.post('/tank/add', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { grapeInventoryId } = request.body as { grapeInventoryId: number };

        const [tank] = await db.select().from(tanks).where(eq(tanks.playerId, playerId)).limit(1);
        if (!tank) return reply.status(404).send({ error: 'Tank not found' });
        if (tank.status !== 'empty') return reply.status(400).send({ error: 'Tank is fermenting or ready, cannot add grapes.' });

        const slotsList = JSON.parse(tank.slots);
        // Find first empty slot index
        const firstEmptyIdx = slotsList.findIndex((s: any) => s === null);
        if (firstEmptyIdx === -1) return reply.status(400).send({ error: 'Tank is full (3/3).' });

        // Get grape from inventory
        const [grape] = await db.select().from(grapeInventory)
            .where(and(eq(grapeInventory.id, grapeInventoryId), eq(grapeInventory.playerId, playerId)))
            .limit(1);

        if (!grape || grape.quantity < 1.0) {
            return reply.status(400).send({ error: 'Not enough grapes to fill a slot. You need at least 1.0 quantity of the same grape and quality.' });
        }

        // Deduct exactly 1.0 from inventory
        await db.update(grapeInventory)
            .set({ quantity: sql`${grapeInventory.quantity} - 1.0` })
            .where(eq(grapeInventory.id, grapeInventoryId));

        // Delete inventory row if quantity drops to exactly 0 (handling floating point)
        if (grape.quantity - 1.0 <= 0.001) {
            await db.delete(grapeInventory).where(eq(grapeInventory.id, grapeInventoryId));
        }

        slotsList[firstEmptyIdx] = { grapeType: grape.grapeType, quality: grape.quality };
        await db.update(tanks).set({ slots: JSON.stringify(slotsList) }).where(eq(tanks.id, tank.id));

        return { success: true, message: `Filled 1 slot with ${grape.grapeType}.` };
    });

    app.post('/tank/start', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };

        const [tank] = await db.select().from(tanks).where(eq(tanks.playerId, playerId)).limit(1);
        if (!tank || tank.status !== 'empty') return reply.status(400).send({ error: 'Invalid tank status' });

        const slotsList = JSON.parse(tank.slots);
        const filledSlots = slotsList.filter((s: any) => s !== null);

        if (filledSlots.length === 0) return reply.status(400).send({ error: 'Tank is completely empty.' });

        const now = new Date();
        const readyAt = new Date(now.getTime() + 60_000); // 1 minute fermentation
        const spoilsAt = new Date(readyAt.getTime() + 120_000); // Oxidation starts 2 minutes after ready

        await db.update(tanks).set({
            status: 'fermenting',
            startedAt: now,
            readyAt,
            spoilsAt
        }).where(eq(tanks.id, tank.id));

        return { success: true, message: 'Fermentation started!' };
    });

    // Cleanup Spoiled Tank (Loss of grapes)
    app.post('/tank/clean', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };

        const [tank] = await db.select().from(tanks).where(eq(tanks.playerId, playerId)).limit(1);
        if (!tank) return reply.status(404).send({ error: 'Tank not found' });
        if (tank.status !== 'spoiled') return reply.status(400).send({ error: 'Tank is not spoiled' });

        await db.update(tanks).set({
            status: 'empty',
            slots: '[null, null, null]',
            startedAt: null,
            readyAt: null,
            spoilsAt: null
        }).where(eq(tanks.id, tank.id));

        return { success: true, message: 'Spoiled wine discarded. Tank is clean and ready to use.' };
    });

    app.post('/tank/transfer', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { barrelItemId } = request.body as { barrelItemId: number };

        const [tank] = await db.select().from(tanks).where(eq(tanks.playerId, playerId)).limit(1);

        const now = new Date();
        if (!tank) return reply.status(404).send({ error: 'Tank not found' });

        if (tank.status === 'spoiled' || (tank.spoilsAt && tank.spoilsAt <= now)) {
            return reply.status(400).send({ error: 'Wine is spoiled due to oxidation. Cannot transfer.' });
        }

        const isReady = (tank.status === 'fermenting' && tank.readyAt && tank.readyAt <= now) || tank.status === 'ready';
        if (!isReady) {
            return reply.status(400).send({ error: 'Tank is not ready.' });
        }

        const slotsList = JSON.parse(tank.slots);
        const filledSlots = slotsList.filter((s: any) => s !== null);
        const needed = filledSlots.length;
        if (needed === 0) return reply.status(400).send({ error: 'Tank has no wine.' });

        // Double check blend compatibility before transferring (in case GET / was not called recently to update status)
        if (!isBlendCompatible(filledSlots)) {
            await db.update(tanks).set({ status: 'spoiled' }).where(eq(tanks.id, tank.id));
            return reply.status(400).send({ error: 'Incompatible grapes. Wine spoiled!' });
        }

        const [barrelInv] = await db.select({ invId: inventory.id, qty: inventory.quantity })
            .from(inventory)
            .where(and(eq(inventory.playerId, playerId), eq(inventory.itemId, barrelItemId)))
            .limit(1);

        if (!barrelInv || barrelInv.qty < needed) {
            return reply.status(400).send({ error: `Not enough empty barrels. You need ${needed}.` });
        }

        const [barrelItem] = await db.select().from(shopItems).where(eq(shopItems.id, barrelItemId)).limit(1);
        const metadata = JSON.parse(barrelItem.metadata ?? '{}');
        const agingTimeMs = metadata.agingTimeMs ?? 180_000;
        const upgradeQuality = metadata.qualityMultiplier ?? 1.5;

        // Calculate average base quality from the filled slots
        const sumQuality = filledSlots.reduce((acc: number, cur: any) => acc + (cur.quality || 1), 0);
        const avgBaseQuality = sumQuality / needed;

        if (barrelInv.qty === needed) {
            await db.delete(inventory).where(eq(inventory.id, barrelInv.invId));
        } else {
            await db.update(inventory)
                .set({ quantity: sql`${inventory.quantity} - ${needed}` })
                .where(eq(inventory.id, barrelInv.invId));
        }

        // We already know it's a compatible blend (or MVP handles single grape only)
        const wineBase = Array.from(new Set(filledSlots.map((s: any) => s.grapeType))).join(' / ');
        const readyAt = new Date(now.getTime() + agingTimeMs);

        const barrelInserts = [];
        for (let i = 0; i < needed; i++) {
            barrelInserts.push({
                playerId,
                barrelItemId,
                barrelType: barrelItem.name,
                status: 'aging' as const,
                wineBase: wineBase,
                startedAt: now,
                readyAt,
                quality: avgBaseQuality * upgradeQuality,
            });
        }
        await db.insert(barrels).values(barrelInserts);

        await db.update(tanks).set({
            status: 'empty',
            slots: '[null, null, null]',
            startedAt: null,
            readyAt: null,
            spoilsAt: null
        }).where(eq(tanks.id, tank.id));

        return { success: true, message: `Transferred wine to ${needed} barrels.` };
    });

    app.post('/barrel/collect', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { barrelId } = request.body as { barrelId: number };

        const [barrel] = await db.select().from(barrels)
            .where(and(eq(barrels.id, barrelId), eq(barrels.playerId, playerId)))
            .limit(1);

        if (!barrel) return reply.status(404).send({ error: 'Barrel not found' });

        const now = new Date();
        if (barrel.readyAt > now) {
            return reply.status(400).send({ error: 'Wine not ready' });
        }

        const wineName = `${barrel.wineBase} (${barrel.barrelType})`;

        await db.insert(wines).values({
            playerId,
            name: wineName,
            grapeType: barrel.wineBase,
            barrelType: barrel.barrelType,
            quality: barrel.quality,
        });

        await db.delete(barrels).where(eq(barrels.id, barrelId));

        return { success: true, wine: { name: wineName, quality: barrel.quality } };
    });

    app.post('/sell', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { wineId } = request.body as { wineId: number };

        const [wine] = await db.select().from(wines)
            .where(and(eq(wines.id, wineId), eq(wines.playerId, playerId)))
            .limit(1);

        if (!wine) return reply.status(404).send({ error: 'Wine not found' });

        const sellPrice = Math.round(BASE_WINE_PRICE * wine.quality);

        await db.update(players)
            .set({ corkBalance: sql`${players.corkBalance} + ${sellPrice}` })
            .where(eq(players.id, playerId));

        await db.delete(wines).where(eq(wines.id, wineId));

        return { success: true, earned: sellPrice, message: `Sold ${wine.name} for ${sellPrice} $CORK!` };
    });
}
