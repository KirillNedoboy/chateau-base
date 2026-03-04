import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { players, inventory, shopItems } from '../db/schema.js';

export async function playerRoutes(app: FastifyInstance) {
    // All player routes require auth
    app.addHook('onRequest', (app as any).authenticate);

    /** Get player profile */
    app.get('/', async (request) => {
        const { id } = request.user as { id: number };
        const [player] = await db.select({
            id: players.id,
            username: players.username,
            corkBalance: players.corkBalance,
            level: players.level,
            createdAt: players.createdAt,
        }).from(players).where(eq(players.id, id));

        return { player };
    });

    /** Get player inventory (joined with item details) */
    app.get('/inventory', async (request) => {
        const { id } = request.user as { id: number };

        const items = await db
            .select({
                inventoryId: inventory.id,
                quantity: inventory.quantity,
                itemId: shopItems.id,
                name: shopItems.name,
                type: shopItems.type,
                description: shopItems.description,
                metadata: shopItems.metadata,
            })
            .from(inventory)
            .innerJoin(shopItems, eq(inventory.itemId, shopItems.id))
            .where(eq(inventory.playerId, id));

        return { inventory: items };
    });
}
