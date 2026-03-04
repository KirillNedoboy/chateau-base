import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HUD from '../components/HUD';
import { api } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { formatTime } from '../hooks/useTimers';
import type { VineyardPlot } from '../types';
import './GamePage.css';

export default function VineyardPage() {
    const navigate = useNavigate();
    const { refreshPlayer, refreshInventory, inventory } = usePlayerStore();
    const [plots, setPlots] = useState<VineyardPlot[]>([]);
    const [message, setMessage] = useState('');
    const [planting, setPlanting] = useState<number | null>(null); // plotId being planted

    const saplings = inventory.filter((i) => i.type === 'sapling');

    const loadPlots = useCallback(async () => {
        const { plots } = await api.vineyard.list();
        setPlots(plots);
    }, []);

    useEffect(() => {
        loadPlots();
        refreshInventory();
        const id = setInterval(loadPlots, 3000); // Poll for timer updates
        return () => clearInterval(id);
    }, [loadPlots, refreshInventory]);

    const handlePlant = useCallback(async (plotId: number, saplingItemId: number) => {
        setMessage('');
        try {
            await api.vineyard.plant(plotId, saplingItemId);
            setMessage('🌱 Planted!');
            setPlanting(null);
            await Promise.all([loadPlots(), refreshInventory()]);
        } catch (err: any) {
            setMessage(err.message);
        }
    }, [loadPlots, refreshInventory]);

    const handleHarvest = useCallback(async (plotId: number) => {
        setMessage('');
        try {
            const { harvest } = await api.vineyard.harvest(plotId);
            setMessage(`🍇 Harvested ${harvest.grapeType}! Head to the Winery to ferment.`);
            await Promise.all([loadPlots(), refreshPlayer()]);
        } catch (err: any) {
            setMessage(err.message);
        }
    }, [loadPlots, refreshPlayer]);

    const getPlotVisual = (plot: VineyardPlot) => {
        if (plot.status === 'empty') return { emoji: '🟫', label: 'Empty Plot' };
        if (plot.isReady) return { emoji: '🍇', label: `${plot.grapeType} — Ready!` };
        const remaining = plot.timeRemainingMs ?? 0;
        return { emoji: '🌿', label: `${plot.grapeType} — ${formatTime(remaining)}` };
    };

    return (
        <>
            <HUD />
            <div className="page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/hub')}>←</button>
                    <h1>🍇 Vineyard</h1>
                </div>

                {message && <div className="game-message fade-in">{message}</div>}

                <div className="vineyard-grid">
                    {plots.map((plot) => {
                        const visual = getPlotVisual(plot);
                        return (
                            <div key={plot.id} className={`plot-card card ${plot.status !== 'empty' ? 'plot-active' : ''}`}>
                                <span className="plot-emoji">{visual.emoji}</span>
                                <span className="plot-label">{visual.label}</span>

                                {/* Growing progress bar */}
                                {plot.status === 'growing' && !plot.isReady && plot.timeRemainingMs != null && plot.plantedAt && plot.harvestReadyAt && (
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${Math.max(0, 100 - (plot.timeRemainingMs / (new Date(plot.harvestReadyAt).getTime() - new Date(plot.plantedAt).getTime())) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Actions */}
                                {plot.status === 'empty' && (
                                    planting === plot.id ? (
                                        <div className="plot-saplings">
                                            {saplings.length === 0 ? (
                                                <p className="plot-hint">No saplings! Visit the Shop.</p>
                                            ) : (
                                                saplings.map((s) => (
                                                    <button key={s.itemId} className="btn btn-small btn-success" onClick={() => handlePlant(plot.id, s.itemId)}>
                                                        {s.name} ({s.quantity})
                                                    </button>
                                                ))
                                            )}
                                            <button className="btn btn-small" onClick={() => setPlanting(null)}>Cancel</button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-small btn-primary" onClick={() => setPlanting(plot.id)}>Plant</button>
                                    )
                                )}

                                {plot.isReady && (
                                    <button className="btn btn-small btn-success" onClick={() => handleHarvest(plot.id)}>
                                        🫳 Harvest
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
