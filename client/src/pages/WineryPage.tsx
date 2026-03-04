import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HUD from '../components/HUD';
import { api } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { useWineryStore } from '../store/useWineryStore';
import { formatTime } from '../hooks/useTimers';
import './GamePage.css';

export default function WineryPage() {
    const navigate = useNavigate();
    const { refreshPlayer, refreshInventory, inventory: playerInventory } = usePlayerStore();
    const { grapeInventory, tanks, barrels, wines, fetchWinery, error } = useWineryStore();
    const [message, setMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const emptyBarrels = playerInventory.filter((i) => i.type === 'barrel');

    useEffect(() => {
        fetchWinery();
        refreshInventory();
        const id = setInterval(fetchWinery, 3000);
        return () => clearInterval(id);
    }, [fetchWinery, refreshInventory]);

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        setActionLoading(true);
        setMessage('');
        try {
            const result = await action();
            setMessage(result?.message || successMsg);
            await Promise.all([fetchWinery(), refreshInventory(), refreshPlayer()]);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const mainTank = tanks[0]; // Assuming 1 tank for MVP

    // Calculate pulse class based on time remaining until spoiled
    const getPulseClass = (spoilsRemainingMs: number | null | undefined) => {
        if (!spoilsRemainingMs) return '';
        if (spoilsRemainingMs > 60000) return 'pulse-green'; // > 1 min safe
        if (spoilsRemainingMs > 15000) return 'pulse-yellow'; // > 15 sec warning
        return 'pulse-red'; // danger
    };

    return (
        <>
            <HUD />
            <div className="page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/hub')}>←</button>
                    <h1>🛢️ Winery & Cellar</h1>
                </div>

                {(message || error) && <div className="game-message fade-in" style={{ backgroundColor: error ? '#ffcccc' : undefined, color: error ? 'red' : undefined }}>{error || message}</div>}

                {/* Grape Inventory */}
                {grapeInventory.length > 0 && (
                    <section className="winery-section">
                        <h2 className="section-title">🍇 Grape Inventory</h2>
                        <div className="grid grid-2">
                            {grapeInventory.map(grape => (
                                <div key={grape.id} className="card">
                                    <h3 className="item-name">{grape.grapeType} {grape.quality > 1 && '⭐'}</h3>
                                    <div style={{ backgroundColor: '#2a2a2a', height: '10px', borderRadius: '5px', overflow: 'hidden', margin: '10px 0' }}>
                                        <div style={{ width: `${(grape.quantity % 1) * 100}%`, backgroundColor: '#8b5cf6', height: '100%' }} />
                                    </div>
                                    <p className="item-desc">Total: {grape.quantity.toFixed(2)} units ({(grape.quantity % 1) * 100}% towards next slot)</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Fermentation Tank */}
                {mainTank && (
                    <section className="winery-section">
                        <h2 className="section-title">🧪 Fermentation Tank</h2>
                        <div className={`card ${mainTank.status === 'spoiled' ? 'card-danger' : ''} ${mainTank.isReady ? getPulseClass(mainTank.spoilsRemainingMs) : ''}`}>
                            <div className="batch-header">
                                <span>{mainTank.status === 'fermenting' ? '🧪' : mainTank.status === 'spoiled' ? '💀' : '🧊'}</span>
                                <span className={`batch-status ${mainTank.status === 'spoiled' ? 'text-red' : ''}`}>Status: {mainTank.status.toUpperCase()}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
                                {[0, 1, 2].map((i) => {
                                    const slot = mainTank.slots[i];
                                    return (
                                        <div key={i} style={{ flex: 1, padding: '10px', textAlign: 'center', border: '1px solid #444', borderRadius: '4px', backgroundColor: slot ? '#2d1b2e' : '#1a1a1a' }}>
                                            {slot ? (
                                                <p style={{ margin: 0, fontSize: '0.8rem' }}>{slot.grapeType} {slot.quality > 1 ? '⭐' : ''}</p>
                                            ) : (
                                                <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>Empty Slot</p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {mainTank.status === 'empty' && (
                                <div className="tank-actions">
                                    <h4 style={{ marginTop: '10px' }}>Add Grapes (Requires 1.0 unit):</h4>
                                    <div className="grape-options" style={{ marginBottom: '10px' }}>
                                        {grapeInventory.filter(g => g.quantity >= 1).map((grape) => (
                                            <button key={grape.id} className="btn btn-small" onClick={() => handleAction(() => api.winery.tankAdd(grape.id), '')} disabled={actionLoading || !mainTank.slots.includes(null)}>
                                                + Fill 1 Slot ({grape.grapeType} {grape.quality > 1 ? '⭐' : ''})
                                            </button>
                                        ))}
                                        {grapeInventory.filter(g => g.quantity >= 1).length === 0 && (
                                            <p className="item-desc" style={{ fontStyle: 'italic', color: '#888' }}>Not enough full units to fill a slot. Harvest more!</p>
                                        )}
                                    </div>
                                    <button
                                        className={`btn ${!mainTank.slots.includes(null) ? 'btn-success' : ''}`}
                                        onClick={() => handleAction(() => api.winery.tankStart(), '')}
                                        disabled={actionLoading || mainTank.slots.every(s => s === null)}
                                        style={{ width: '100%' }}
                                    >
                                        Start Fermentation
                                    </button>
                                </div>
                            )}

                            {mainTank.status === 'fermenting' && !mainTank.isReady && (
                                <div className="timer-badge">🧪 Fermenting... ⏱ {formatTime(mainTank.timeRemainingMs ?? 0)}</div>
                            )}

                            {mainTank.status === 'ready' && (
                                <div className="tank-actions" style={{ marginTop: '10px' }}>

                                    <div className="timer-badge" style={{ backgroundColor: 'transparent', border: '1px solid currentColor', marginBottom: '10px' }}>
                                        ⚠️ Oxidation in ⏱ {formatTime(mainTank.spoilsRemainingMs ?? 0)}
                                    </div>

                                    <h4>Transfer to Barrels ({mainTank.slots.filter(s => s !== null).length} needed):</h4>
                                    {emptyBarrels.length > 0 ? emptyBarrels.map((b) => (
                                        <button key={b.itemId} className="btn btn-small" onClick={() => handleAction(() => api.winery.tankTransfer(b.itemId), '')} disabled={actionLoading} style={{ marginRight: '5px', marginBottom: '5px' }}>
                                            Transfer {mainTank.slots.filter(s => s !== null).length} part(s) to {b.name} ({b.quantity} available)
                                        </button>
                                    )) : (
                                        <p style={{ color: 'red' }}>Not enough barrels! Buy them in the shop.</p>
                                    )}
                                </div>
                            )}

                            {mainTank.status === 'spoiled' && (
                                <div className="tank-actions" style={{ marginTop: '10px' }}>
                                    <p style={{ color: '#ff4c4c', fontWeight: 'bold' }}>This batch is completely ruined and turned into vinegar.</p>
                                    <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => handleAction(() => api.winery.tankClean(), '')} disabled={actionLoading}>
                                        🗑️ Discard & Clean Tank
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Aging Barrels */}
                {barrels.length > 0 && (
                    <section className="winery-section">
                        <h2 className="section-title">⏳ Aging Barrels</h2>
                        <div className="grid grid-2">
                            {barrels.map((barrel) => (
                                <div key={barrel.id} className="card">
                                    <div className="batch-header">
                                        <span>🛢️</span>
                                        <span className="batch-status">{barrel.status}</span>
                                    </div>
                                    <h3 className="item-name">{barrel.wineBase}</h3>
                                    <p className="item-desc">In: {barrel.barrelType}</p>
                                    <p className="item-desc">Projected Quality: {barrel.quality.toFixed(1)}x</p>

                                    {!barrel.isReady ? (
                                        <div className="timer-badge">⏱ {formatTime(barrel.timeRemainingMs ?? 0)}</div>
                                    ) : (
                                        <button className="btn btn-small btn-success" onClick={() => handleAction(() => api.winery.barrelCollect(barrel.id), 'Wine added to cellar!')} disabled={actionLoading} style={{ marginTop: '10px' }}>
                                            🍷 Collect Premium Wine
                                        </button>
                                    )}
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
                                    <button className="btn btn-small btn-primary" onClick={() => handleAction(() => api.winery.sell(wine.id), '')} disabled={actionLoading}>
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
