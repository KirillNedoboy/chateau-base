import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { vineyardPlots, inventory, shopItems } from '../db/schema.js';

export async function vineyardRoutes(app: FastifyInstance) {
    app.addHook('onRequest', (app as any).authenticate);

    /** Get all vineyard plots for the player */
    app.get('/', async (request) => {
        const { id: playerId } = request.user as { id: number };
        const plots = await db.select().from(vineyardPlots).where(eq(vineyardPlots.playerId, playerId));

        // Mark plots as ready if harvest time has passed
        const now = new Date();
        const enrichedPlots = plots.map((plot) => ({
            ...plot,
            isReady: plot.status === 'growing' && plot.harvestReadyAt && plot.harvestReadyAt <= now,
            timeRemainingMs: plot.harvestReadyAt ? Math.max(0, plot.harvestReadyAt.getTime() - now.getTime()) : null,
        }));

        return { plots: enrichedPlots };
    });

    /** Plant a sapling in an empty plot */
    app.post('/plant', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { plotId, saplingItemId } = request.body as { plotId: number; saplingItemId: number };

        // Verify plot belongs to player and is empty
        const [plot] = await db.select().from(vineyardPlots)
            .where(and(eq(vineyardPlots.id, plotId), eq(vineyardPlots.playerId, playerId)))
            .limit(1);

        if (!plot) return reply.status(404).send({ error: 'Plot not found' });
        if (plot.status !== 'empty') return reply.status(400).send({ error: 'Plot is not empty' });

        // Verify sapling in inventory
        const [inv] = await db.select().from(inventory)
            .where(and(eq(inventory.playerId, playerId), eq(inventory.itemId, saplingItemId)))
            .limit(1);

        if (!inv || inv.quantity < 1) return reply.status(400).send({ error: 'No sapling in inventory' });

        // Get growth time from item metadata
        const [item] = await db.select().from(shopItems).where(eq(shopItems.id, saplingItemId)).limit(1);
        const metadata = JSON.parse(item.metadata ?? '{}');
        const growthTimeMs = metadata.growthTimeMs ?? 120_000;

        const now = new Date();
        const harvestReadyAt = new Date(now.getTime() + growthTimeMs);

        // Consume sapling from inventory
        if (inv.quantity === 1) {
            await db.delete(inventory).where(eq(inventory.id, inv.id));
        } else {
            await db.update(inventory)
                .set({ quantity: sql`${inventory.quantity} - 1` })
                .where(eq(inventory.id, inv.id));
        }

        // Update plot
        await db.update(vineyardPlots).set({
            grapeType: item.name,
            plantedAt: now,
            harvestReadyAt,
            status: 'growing',
        }).where(eq(vineyardPlots.id, plotId));

        return {
            success: true,
            plot: { id: plotId, grapeType: item.name, plantedAt: now, harvestReadyAt, status: 'growing' },
        };
    });

    /** Harvest a ready plot — returns grapes to a virtual "harvest" state */
    app.post('/harvest', async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { plotId } = request.body as { plotId: number };

        const [plot] = await db.select().from(vineyardPlots)
            .where(and(eq(vineyardPlots.id, plotId), eq(vineyardPlots.playerId, playerId)))
            .limit(1);

        if (!plot) return reply.status(404).send({ error: 'Plot not found' });
        if (plot.status !== 'growing') return reply.status(400).send({ error: 'Nothing to harvest' });

        const now = new Date();
        if (plot.harvestReadyAt && plot.harvestReadyAt > now) {
            return reply.status(400).send({ error: 'Grapes not ready yet', timeRemainingMs: plot.harvestReadyAt.getTime() - now.getTime() });
        }

        // Reset plot to empty
        await db.update(vineyardPlots).set({
            status: 'empty',
            grapeType: null,
            plantedAt: null,
            harvestReadyAt: null,
        }).where(eq(vineyardPlots.id, plotId));

        return {
            success: true,
            harvest: { grapeType: plot.grapeType, quantity: 1 },
            message: `Harvested ${plot.grapeType}! Take it to the Winery.`,
        };
    });
}
