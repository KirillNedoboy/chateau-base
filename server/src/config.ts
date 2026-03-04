import 'dotenv/config';

/** Centralized config with validation */
const config = {
    port: Number(process.env.PORT) || 3001,
    host: '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://chateau:chateau_secret@localhost:5432/chateau_base',
    jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    initialBalance: Number(process.env.INITIAL_BALANCE) || 500,
} as const;

export default config;
