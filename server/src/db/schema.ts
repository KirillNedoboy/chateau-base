import { pgTable, serial, text, integer, timestamp, pgEnum, real } from 'drizzle-orm/pg-core';

/* ── Enums ── */

export const plotStatusEnum = pgEnum('plot_status', ['empty', 'growing', 'ready']);
export const batchStatusEnum = pgEnum('batch_status', ['fermenting', 'aging', 'done']);
export const shopItemTypeEnum = pgEnum('shop_item_type', ['sapling', 'barrel', 'equipment']);

/* ── Players ── */

export const players = pgTable('players', {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    corkBalance: integer('cork_balance').notNull().default(500),
    level: integer('level').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* ── Shop catalog (seeded, not player-owned) ── */

export const shopItems = pgTable('shop_items', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: shopItemTypeEnum('type').notNull(),
    price: integer('price').notNull(),
    description: text('description').notNull().default(''),
    /** Extra data: growth time (saplings), quality bonus (barrels), etc. */
    metadata: text('metadata').default('{}'),
});

/* ── Player inventory ── */

export const inventory = pgTable('inventory', {
    id: serial('id').primaryKey(),
    playerId: integer('player_id').notNull().references(() => players.id),
    itemId: integer('item_id').notNull().references(() => shopItems.id),
    quantity: integer('quantity').notNull().default(1),
});

/* ── Vineyard plots ── */

export const vineyardPlots = pgTable('vineyard_plots', {
    id: serial('id').primaryKey(),
    playerId: integer('player_id').notNull().references(() => players.id),
    grapeType: text('grape_type'),
    plantedAt: timestamp('planted_at'),
    harvestReadyAt: timestamp('harvest_ready_at'),
    status: plotStatusEnum('status').notNull().default('empty'),
});

/* ── Winery batches ── */

export const wineryBatches = pgTable('winery_batches', {
    id: serial('id').primaryKey(),
    playerId: integer('player_id').notNull().references(() => players.id),
    grapeType: text('grape_type').notNull(),
    barrelType: text('barrel_type'), // null = basic fermentation only
    startedAt: timestamp('started_at').notNull(),
    readyAt: timestamp('ready_at').notNull(),
    status: batchStatusEnum('status').notNull().default('fermenting'),
    quality: real('quality').notNull().default(1.0),
});

/* ── Finished wines ── */

export const wines = pgTable('wines', {
    id: serial('id').primaryKey(),
    playerId: integer('player_id').notNull().references(() => players.id),
    name: text('name').notNull(),
    grapeType: text('grape_type').notNull(),
    barrelType: text('barrel_type'),
    quality: real('quality').notNull().default(1.0),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
