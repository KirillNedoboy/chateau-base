import { useState, useEffect } from 'react';

/** Countdown hook — returns remaining ms from a target timestamp. Ticks every second. */
export function useCountdown(targetMs: number | null | undefined): number {
    const [remaining, setRemaining] = useState(() => {
        if (!targetMs) return 0;
        return Math.max(0, targetMs - Date.now());
    });

    useEffect(() => {
        if (!targetMs) { setRemaining(0); return; }

        const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetMs]);

    return remaining;
}

/** Format milliseconds to MM:SS */
export function formatTime(ms: number): string {
    if (ms <= 0) return '00:00';
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Polling hook for auto-refreshing game data */
export function usePolling(callback: () => void, intervalMs = 5000) {
    useEffect(() => {
        callback();
        const id = setInterval(callback, intervalMs);
        return () => clearInterval(id);
    }, [callback, intervalMs]);
}
