import type { FastifyInstance } from 'fastify';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { shopItems, inventory, players } from '../db/schema.js';

export async function shopRoutes(app: FastifyInstance) {
    /** Public: list all shop items */
    app.get('/', async () => {
        const items = await db.select().from(shopItems);
        return { items };
    });

    /** Buy an item (requires auth) */
    app.post('/buy', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
        const { id: playerId } = request.user as { id: number };
        const { itemId, quantity = 1 } = request.body as { itemId: number; quantity?: number };

        if (!itemId || quantity < 1) {
            return reply.status(400).send({ error: 'Valid itemId and quantity required' });
        }

        // Find the item and verify it exists
        const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId)).limit(1);
        if (!item) {
            return reply.status(404).send({ error: 'Item not found' });
        }

        const totalCost = item.price * quantity;

        // Check player balance
        const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
        if (player.corkBalance < totalCost) {
            return reply.status(400).send({ error: 'Not enough $CORK', required: totalCost, balance: player.corkBalance });
        }

        // Deduct balance
        await db.update(players)
            .set({ corkBalance: sql`${players.corkBalance} - ${totalCost}` })
            .where(eq(players.id, playerId));

        // Add to inventory (upsert: increment quantity if already owned)
        const [existing] = await db.select().from(inventory)
            .where(and(eq(inventory.playerId, playerId), eq(inventory.itemId, itemId)))
            .limit(1);

        if (existing) {
            await db.update(inventory)
                .set({ quantity: sql`${inventory.quantity} + ${quantity}` })
                .where(eq(inventory.id, existing.id));
        } else {
            await db.insert(inventory).values({ playerId, itemId, quantity });
        }

        return {
            success: true,
            purchased: { name: item.name, quantity },
            newBalance: player.corkBalance - totalCost,
        };
    });
}
