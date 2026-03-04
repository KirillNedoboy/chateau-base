import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import config from './config.js';
import { authRoutes } from './routes/auth.js';
import { playerRoutes } from './routes/player.js';
import { shopRoutes } from './routes/shop.js';
import { vineyardRoutes } from './routes/vineyard.js';
import { wineryRoutes } from './routes/winery.js';

const app = Fastify({ logger: true });

async function start() {
    // Plugins
    await app.register(cors, { origin: config.corsOrigin });
    await app.register(jwt, { secret: config.jwtSecret });

    // Auth decorator — available on every request
    app.decorate('authenticate', async (request: any, reply: any) => {
        try {
            await request.jwtVerify();
        } catch {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Routes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(playerRoutes, { prefix: '/api/player' });
    await app.register(shopRoutes, { prefix: '/api/shop' });
    await app.register(vineyardRoutes, { prefix: '/api/vineyard' });
    await app.register(wineryRoutes, { prefix: '/api/winery' });

    // Health check
    app.get('/api/health', async () => ({ status: 'ok' }));

    await app.listen({ port: config.port, host: config.host });
    console.log(`🏰 Chateau Base API running on port ${config.port}`);
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
