import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HUD from '../components/HUD';
import { api } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import type { ShopItem } from '../types';
import './GamePage.css';

export default function ShopPage() {
    const navigate = useNavigate();
    const { refreshPlayer } = usePlayerStore();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [buying, setBuying] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        api.shop.list().then(({ items }) => setItems(items));
    }, []);

    const handleBuy = useCallback(async (itemId: number) => {
        setBuying(itemId);
        setMessage('');
        try {
            const { newBalance } = await api.shop.buy(itemId, 1);
            setMessage(`Purchased! New balance: ${newBalance} $CORK`);
            await refreshPlayer();
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setBuying(null);
        }
    }, [refreshPlayer]);

    const getTypeEmoji = (type: string) => {
        if (type === 'sapling') return '🌱';
        if (type === 'barrel') return '🛢️';
        return '⚙️';
    };

    const getTypeLabel = (type: string) => {
        if (type === 'sapling') return 'Sapling';
        if (type === 'barrel') return 'Barrel';
        return 'Equipment';
    };

    return (
        <>
            <HUD />
            <div className="page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/hub')}>←</button>
                    <h1>🏪 Shop</h1>
                </div>

                {message && <div className="game-message fade-in">{message}</div>}

                <div className="grid grid-2">
                    {items.map((item, i) => (
                        <div key={item.id} className="card item-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="item-header">
                                <span className="item-emoji">{getTypeEmoji(item.type)}</span>
                                <span className="item-type-badge">{getTypeLabel(item.type)}</span>
                            </div>
                            <h3 className="item-name">{item.name}</h3>
                            <p className="item-desc">{item.description}</p>
                            <div className="item-footer">
                                <span className="item-price">🪙 {item.price}</span>
                                <button
                                    className="btn btn-primary btn-small"
                                    onClick={() => handleBuy(item.id)}
                                    disabled={buying === item.id}
                                >
                                    {buying === item.id ? '...' : 'Buy'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
