import { create } from 'zustand';
import { api } from '../services/api';
import type { GrapeInventory, Tank, Barrel, Wine } from '../types';

interface WineryState {
    grapeInventory: GrapeInventory[];
    tanks: Tank[];
    barrels: Barrel[];
    wines: Wine[];
    isLoading: boolean;
    error: string | null;
    fetchWinery: () => Promise<void>;
}

export const useWineryStore = create<WineryState>((set) => ({
    grapeInventory: [],
    tanks: [],
    barrels: [],
    wines: [],
    isLoading: false,
    error: null,

    fetchWinery: async () => {
        try {
            set({ isLoading: true, error: null });
            const data = await api.winery.list();
            set({
                grapeInventory: data.grapeInventory || [],
                tanks: data.tanks || [],
                barrels: data.barrels || [],
                wines: data.wines || [],
                isLoading: false
            });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    }
}));
