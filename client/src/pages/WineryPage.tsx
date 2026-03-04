import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HUD from '../components/HUD';
import { api } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { formatTime } from '../hooks/useTimers';
import type { WineryBatch, Wine } from '../types';
import './GamePage.css';

export default function WineryPage() {
    const navigate = useNavigate();
    const { refreshPlayer, refreshInventory, inventory } = usePlayerStore();
    const [batches, setBatches] = useState<WineryBatch[]>([]);
    const [wines, setWines] = useState<Wine[]>([]);
    const [message, setMessage] = useState('');
    const [fermenting, setFermenting] = useState(false);

    const barrels = inventory.filter((i) => i.type === 'barrel');

    const loadWinery = useCallback(async () => {
        const data = await api.winery.list();
        setBatches(data.batches);
        setWines(data.wines);
    }, []);

    useEffect(() => {
        loadWinery();
        refreshInventory();
        const id = setInterval(loadWinery, 3000);
        return () => clearInterval(id);
    }, [loadWinery, refreshInventory]);

    const handleFerment = useCallback(async (grapeType: string) => {
        setFermenting(true);
        setMessage('');
        try {
            await api.winery.ferment(grapeType);
            setMessage(`🧪 Fermentation started for ${grapeType}!`);
            await loadWinery();
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setFermenting(false);
        }
    }, [loadWinery]);

    const handleAge = useCallback(async (batchId: number, barrelItemId: number) => {
        setMessage('');
        try {
            await api.winery.age(batchId, barrelItemId);
            setMessage('🛢️ Wine is now aging in oak!');
            await Promise.all([loadWinery(), refreshInventory()]);
        } catch (err: any) {
            setMessage(err.message);
        }
    }, [loadWinery, refreshInventory]);

    const handleCollect = useCallback(async (batchId: number) => {
        setMessage('');
        try {
            const { wine } = await api.winery.collect(batchId);
            setMessage(`🍷 Collected: ${wine.name} (Quality: ${wine.quality.toFixed(1)}x)`);
            await loadWinery();
        } catch (err: any) {
            setMessage(err.message);
        }
    }, [loadWinery]);

    const handleSell = useCallback(async (wineId: number) => {
        setMessage('');
        try {
            const { earned } = await api.winery.sell(wineId);
            setMessage(`💰 Sold for ${earned} $CORK!`);
            await Promise.all([loadWinery(), refreshPlayer()]);
        } catch (err: any) {
            setMessage(err.message);
        }
    }, [loadWinery, refreshPlayer]);

    // Available grape types from recent harvests (simplified: offer common 3)
    const grapeOptions = ['Cabernet Sauvignon', 'Chardonnay', 'Pinot Noir'];

    return (
        <>
            <HUD />
            <div className="page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/hub')}>←</button>
                    <h1>🛢️ Winery</h1>
                </div>

                {message && <div className="game-message fade-in">{message}</div>}

                {/* Start Fermentation */}
                <section className="winery-section">
                    <h2 className="section-title">🧪 Start Fermentation</h2>
                    <p className="section-hint">Choose grape type from your harvest</p>
                    <div className="grape-options">
                        {grapeOptions.map((grape) => (
                            <button key={grape} className="btn btn-small" onClick={() => handleFerment(grape)} disabled={fermenting}>
                                {grape}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Active Batches */}
                {batches.length > 0 && (
                    <section className="winery-section">
                        <h2 className="section-title">⏳ Active Batches</h2>
                        <div className="grid grid-2">
                            {batches.map((batch) => (
                                <div key={batch.id} className="card">
                                    <div className="batch-header">
                                        <span>{batch.status === 'fermenting' ? '🧪' : '🛢️'}</span>
                                        <span className="batch-status">{batch.status}</span>
                                    </div>
                                    <h3 className="item-name">{batch.grapeType}</h3>
                                    {batch.barrelType && <p className="item-desc">In: {batch.barrelType}</p>}
                                    <p className="item-desc">Quality: {batch.quality.toFixed(1)}x</p>

                                    {!batch.isReady && (
                                        <div className="timer-badge">⏱ {formatTime(batch.timeRemainingMs ?? 0)}</div>
                                    )}

                                    <div className="batch-actions">
                                        {batch.isReady && batch.status === 'fermenting' && (
                                            <>
                                                {barrels.length > 0 && barrels.map((b) => (
                                                    <button key={b.itemId} className="btn btn-small" onClick={() => handleAge(batch.id, b.itemId)}>
                                                        Age in {b.name} ({b.quantity})
                                                    </button>
                                                ))}
                                                <button className="btn btn-small btn-success" onClick={() => handleCollect(batch.id)}>
                                                    Collect (Basic)
                                                </button>
                                            </>
                                        )}
                                        {batch.isReady && batch.status === 'aging' && (
                                            <button className="btn btn-small btn-success" onClick={() => handleCollect(batch.id)}>
                                                🍷 Collect Premium
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Wine Cellar */}
                {wines.length > 0 && (
                    <section className="winery-section">
                        <h2 className="section-title">🍷 Your Wine Collection</h2>
                        <div className="grid grid-2">
                            {wines.map((wine) => (
                                <div key={wine.id} className="card">
                                    <h3 className="item-name">{wine.name}</h3>
                                    <p className="item-desc">Quality: ⭐ {wine.quality.toFixed(1)}x</p>
                                    <p className="item-desc">Est. value: 🪙 {Math.round(40 * wine.quality)}</p>
                                    <button className="btn btn-small btn-primary" onClick={() => handleSell(wine.id)}>
                                        💰 Sell
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
