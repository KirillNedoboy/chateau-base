/* ── Shared types mirroring backend schema ── */

export interface Player {
    id: number;
    username: string;
    corkBalance: number;
    level: number;
}

export interface ShopItem {
    id: number;
    name: string;
    type: 'sapling' | 'barrel' | 'equipment';
    price: number;
    description: string;
    metadata: string;
}

export interface InventoryItem {
    inventoryId: number;
    quantity: number;
    itemId: number;
    name: string;
    type: 'sapling' | 'barrel' | 'equipment';
    description: string;
    metadata: string;
}

export interface VineyardPlot {
    id: number;
    playerId: number;
    grapeType: string | null;
    plantedAt: string | null;
    harvestReadyAt: string | null;
    status: 'empty' | 'growing' | 'ready';
    isReady?: boolean;
    timeRemainingMs?: number | null;
}

export interface WineryBatch {
    id: number;
    playerId: number;
    grapeType: string;
    barrelType: string | null;
    startedAt: string;
    readyAt: string;
    status: 'fermenting' | 'aging' | 'done';
    quality: number;
    isReady?: boolean;
    timeRemainingMs?: number;
}

export interface Wine {
    id: number;
    playerId: number;
    name: string;
    grapeType: string;
    barrelType: string | null;
    quality: number;
    quantity: number;
}
