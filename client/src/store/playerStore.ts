import { create } from 'zustand';
import type { Player, InventoryItem } from '../types';
import { api } from '../services/api';

interface PlayerState {
    player: Player | null;
    inventory: InventoryItem[];
    isAuthenticated: boolean;

    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshPlayer: () => Promise<void>;
    refreshInventory: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set) => ({
    player: null,
    inventory: [],
    isAuthenticated: !!localStorage.getItem('chateau_token'),

    login: async (username, password) => {
        const { token, player } = await api.auth.login(username, password);
        localStorage.setItem('chateau_token', token);
        set({ player, isAuthenticated: true });
    },

    register: async (username, password) => {
        const { token, player } = await api.auth.register(username, password);
        localStorage.setItem('chateau_token', token);
        set({ player, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('chateau_token');
        set({ player: null, inventory: [], isAuthenticated: false });
    },

    refreshPlayer: async () => {
        const { player } = await api.player.get();
        set({ player });
    },

    refreshInventory: async () => {
        const { inventory } = await api.player.inventory();
        set({ inventory });
    },
}));
