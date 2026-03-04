import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { wineryBatches, wines, inventory, shopItems, players } from '../db/schema.js';

/** Wine selling prices by quality tier */
const BASE_WINE_PRICE = 40;

export async function wineryRoutes(app: FastifyInstance) {
    app.addHook('onRequest', (app as any).authenticate);

    /** Get all winery batches + finished wines */
    app.get('/', async (request) => {
        const { id: playerId } = request.user as { id: number };
        const now = new Date();

        const batches = await db.select().from(wineryBatches).where(eq(wineryBatches.playerId, playerId));
        const playerWines = await db.select().from(wines).where(eq(wines.playerId, playerId));

        const enrichedBatches = batches.map((batch) => ({
            ...batch,
            isReady: batch.readyAt <= now,
            timeRemainingMs: Math.max(0, batch.readyAt.getTime() - now.getTime()),
        }));

        return { batches: enrichedBatches, wines: playerWines };
    });

    /** Start fermentation: grape → basic wine */
    app.post('/ferment', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { grapeType } = request.body as { grapeType: string };

        if (!grapeType) return reply.status(400).send({ error: 'grapeType is required' });

        // Check player owns a fermentation vat
        const vatItems = await db.select({ invId: inventory.id, qty: inventory.quantity, itemName: shopItems.name })
            .from(inventory)
            .innerJoin(shopItems, eq(inventory.itemId, shopItems.id))
            .where(and(eq(inventory.playerId, playerId), eq(shopItems.type, 'equipment')));

        if (vatItems.length === 0) {
            return reply.status(400).send({ error: 'You need a Fermentation Vat. Buy one in the Shop.' });
        }

        const now = new Date();
        const fermentTimeMs = 60_000; // 1 minute for MVP
        const readyAt = new Date(now.getTime() + fermentTimeMs);

        const [batch] = await db.insert(wineryBatches).values({
            playerId,
            grapeType,
            startedAt: now,
            readyAt,
            status: 'fermenting',
            quality: 1.0,
        }).returning();

        return { success: true, batch };
    });

    /** Age wine in a barrel (optional upgrade step) */
    app.post('/age', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { batchId, barrelItemId } = request.body as { batchId: number; barrelItemId: number };

        // Find batch
        const [batch] = await db.select().from(wineryBatches)
            .where(and(eq(wineryBatches.id, batchId), eq(wineryBatches.playerId, playerId)))
            .limit(1);

        if (!batch) return reply.status(404).send({ error: 'Batch not found' });

        // Batch must be done fermenting
        const now = new Date();
        if (batch.status !== 'fermenting' || batch.readyAt > now) {
            return reply.status(400).send({ error: 'Batch is not ready for aging' });
        }

        // Check barrel in inventory
        const [barrelInv] = await db.select({ invId: inventory.id, qty: inventory.quantity })
            .from(inventory)
            .where(and(eq(inventory.playerId, playerId), eq(inventory.itemId, barrelItemId)))
            .limit(1);

        if (!barrelInv || barrelInv.qty < 1) {
            return reply.status(400).send({ error: 'No barrel in inventory' });
        }

        // Get barrel metadata
        const [barrelItem] = await db.select().from(shopItems).where(eq(shopItems.id, barrelItemId)).limit(1);
        const metadata = JSON.parse(barrelItem.metadata ?? '{}');
        const agingTimeMs = metadata.agingTimeMs ?? 180_000;
        const qualityMultiplier = metadata.qualityMultiplier ?? 1.5;

        // Consume barrel
        if (barrelInv.qty === 1) {
            await db.delete(inventory).where(eq(inventory.id, barrelInv.invId));
        } else {
            await db.update(inventory)
                .set({ quantity: sql`${inventory.quantity} - 1` })
                .where(eq(inventory.id, barrelInv.invId));
        }

        const readyAt = new Date(now.getTime() + agingTimeMs);

        await db.update(wineryBatches).set({
            status: 'aging',
            barrelType: barrelItem.name,
            startedAt: now,
            readyAt,
            quality: batch.quality * qualityMultiplier,
        }).where(eq(wineryBatches.id, batchId));

        return {
            success: true,
            message: `Wine is aging in ${barrelItem.name}. Quality boosted!`,
            readyAt,
        };
    });

    /** Collect finished wine (from fermented or aged batch) */
    app.post('/collect', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { batchId } = request.body as { batchId: number };

        const [batch] = await db.select().from(wineryBatches)
            .where(and(eq(wineryBatches.id, batchId), eq(wineryBatches.playerId, playerId)))
            .limit(1);

        if (!batch) return reply.status(404).send({ error: 'Batch not found' });

        const now = new Date();
        if (batch.readyAt > now) {
            return reply.status(400).send({ error: 'Wine not ready', timeRemainingMs: batch.readyAt.getTime() - now.getTime() });
        }

        // Create the wine name based on grape + barrel
        const wineName = batch.barrelType
            ? `${batch.grapeType} (${batch.barrelType})`
            : `${batch.grapeType} (Young)`;

        // Add to wine collection
        await db.insert(wines).values({
            playerId,
            name: wineName,
            grapeType: batch.grapeType,
            barrelType: batch.barrelType,
            quality: batch.quality,
        });

        // Remove batch
        await db.delete(wineryBatches).where(eq(wineryBatches.id, batchId));

        return { success: true, wine: { name: wineName, quality: batch.quality } };
    });

    /** Sell wine for $CORK */
    app.post('/sell', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { wineId } = request.body as { wineId: number };

        const [wine] = await db.select().from(wines)
            .where(and(eq(wines.id, wineId), eq(wines.playerId, playerId)))
            .limit(1);

        if (!wine) return reply.status(404).send({ error: 'Wine not found' });

        const sellPrice = Math.round(BASE_WINE_PRICE * wine.quality);

        // Add balance
        await db.update(players)
            .set({ corkBalance: sql`${players.corkBalance} + ${sellPrice}` })
            .where(eq(players.id, playerId));

        // Remove wine
        await db.delete(wines).where(eq(wines.id, wineId));

        return { success: true, earned: sellPrice, message: `Sold ${wine.name} for ${sellPrice} $CORK!` };
    });
}
