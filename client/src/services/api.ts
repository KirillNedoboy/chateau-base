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
            request<{ success: boolean; harvest: { grapeType: string } }>('/vineyard/harvest', {
                method: 'POST', body: JSON.stringify({ plotId }),
            }),
    },

    winery: {
        list: () => request<{ batches: import('../types').WineryBatch[]; wines: import('../types').Wine[] }>('/winery'),
        ferment: (grapeType: string) =>
            request<{ success: boolean }>('/winery/ferment', {
                method: 'POST', body: JSON.stringify({ grapeType }),
            }),
        age: (batchId: number, barrelItemId: number) =>
            request<{ success: boolean }>('/winery/age', {
                method: 'POST', body: JSON.stringify({ batchId, barrelItemId }),
            }),
        collect: (batchId: number) =>
            request<{ success: boolean; wine: { name: string; quality: number } }>('/winery/collect', {
                method: 'POST', body: JSON.stringify({ batchId }),
            }),
        sell: (wineId: number) =>
            request<{ success: boolean; earned: number }>('/winery/sell', {
                method: 'POST', body: JSON.stringify({ wineId }),
            }),
    },
};
