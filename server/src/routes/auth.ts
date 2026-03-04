import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { players, vineyardPlots } from '../db/schema.js';
import config from '../config.js';

const SALT_ROUNDS = 10;
const STARTING_PLOTS = 6; // 3x2 grid

export async function authRoutes(app: FastifyInstance) {
    /** Register new player */
    app.post('/register', async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };

        if (!username || !password || username.length < 3 || password.length < 6) {
            return reply.status(400).send({ error: 'Username (3+ chars) and password (6+ chars) required' });
        }

        // Check if username taken
        const existing = await db.select().from(players).where(eq(players.username, username)).limit(1);
        if (existing.length > 0) {
            return reply.status(409).send({ error: 'Username already taken' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const [player] = await db.insert(players).values({
            username,
            passwordHash,
            corkBalance: config.initialBalance,
        }).returning();

        // Create empty vineyard plots for the new player
        const plots = Array.from({ length: STARTING_PLOTS }, () => ({
            playerId: player.id,
        }));
        await db.insert(vineyardPlots).values(plots);

        const token = app.jwt.sign({ id: player.id, username: player.username });

        return reply.status(201).send({
            token,
            player: { id: player.id, username: player.username, corkBalance: player.corkBalance, level: player.level },
        });
    });

    /** Login */
    app.post('/login', async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };

        const [player] = await db.select().from(players).where(eq(players.username, username)).limit(1);
        if (!player) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, player.passwordHash);
        if (!valid) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const token = app.jwt.sign({ id: player.id, username: player.username });

        return { token, player: { id: player.id, username: player.username, corkBalance: player.corkBalance, level: player.level } };
    });
}
