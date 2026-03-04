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
    harvestCount: number;
    isReady?: boolean;
    timeRemainingMs?: number | null;
}

export interface GrapeInventory {
    id: number;
    playerId: number;
    grapeType: string;
    quality: number;
    quantity: number;
}

export interface Tank {
    id: number;
    playerId: number;
    status: 'empty' | 'fermenting' | 'ready' | 'spoiled';
    slots: Array<{ grapeType: string, quality: number } | null>;
    startedAt: string | null;
    readyAt: string | null;
    spoilsAt: string | null;
    isReady?: boolean;
    timeRemainingMs?: number;
    spoilsRemainingMs?: number | null;
}

export interface Barrel {
    id: number;
    playerId: number;
    barrelItemId: number;
    barrelType: string;
    status: 'aging' | 'ready';
    wineBase: string;
    startedAt: string;
    readyAt: string;
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

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Retrieve stored JWT */
function getToken(): string | null {
    return localStorage.getItem('chateau_token');
}

/** Generic fetch wrapper with auth header */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data as T;
}

/* ── Auth ── */

export const api = {
    auth: {
        register: (username: string, password: string) =>
            request<{ token: string; player: import('../types').Player }>('/auth/register', {
                method: 'POST', body: JSON.stringify({ username, password }),
            }),
        login: (username: string, password: string) =>
            request<{ token: string; player: import('../types').Player }>('/auth/login', {
                method: 'POST', body: JSON.stringify({ username, password }),
            }),
    },

    player: {
        get: () => request<{ player: import('../types').Player }>('/player'),
        inventory: () => request<{ inventory: import('../types').InventoryItem[] }>('/player/inventory'),
    },

    shop: {
        list: () => request<{ items: import('../types').ShopItem[] }>('/shop'),
        buy: (itemId: number, quantity = 1) =>
            request<{ success: boolean; newBalance: number }>('/shop/buy', {
                method: 'POST', body: JSON.stringify({ itemId, quantity }),
            }),
    },

    vineyard: {
        list: () => request<{ plots: import('../types').VineyardPlot[] }>('/vineyard'),
        plant: (plotId: number, saplingItemId: number) =>
            request<{ success: boolean }>('/vineyard/plant', {
                method: 'POST', body: JSON.stringify({ plotId, saplingItemId }),
            }),
        harvest: (plotId: number) =>
            request<{ success: boolean; harvest: { grapeType: string, yield: number, quality: number } }>('/vineyard/harvest', {
                method: 'POST', body: JSON.stringify({ plotId }),
            }),
    },

    winery: {
        list: () => request<{ grapeInventory: GrapeInventory[]; tanks: Tank[]; barrels: Barrel[]; wines: Wine[] }>('/winery'),
        tankAdd: (grapeInventoryId: number) =>
            request<{ success: boolean; message: string }>('/winery/tank/add', {
                method: 'POST', body: JSON.stringify({ grapeInventoryId }),
            }),
        tankStart: () =>
            request<{ success: boolean; message: string }>('/winery/tank/start', {
                method: 'POST',
            }),
        tankClean: () =>
            request<{ success: boolean; message: string }>('/winery/tank/clean', {
                method: 'POST',
            }),
        tankTransfer: (barrelItemId: number) =>
            request<{ success: boolean; message: string }>('/winery/tank/transfer', {
                method: 'POST', body: JSON.stringify({ barrelItemId }),
            }),
        barrelCollect: (barrelId: number) =>
            request<{ success: boolean; wine: { name: string; quality: number } }>('/winery/barrel/collect', {
                method: 'POST', body: JSON.stringify({ barrelId }),
            }),
        sell: (wineId: number) =>
            request<{ success: boolean; earned: number; message: string }>('/winery/sell', {
                method: 'POST', body: JSON.stringify({ wineId }),
            }),
    },
};
