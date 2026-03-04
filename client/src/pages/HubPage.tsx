import { useNavigate } from 'react-router-dom';
import HUD from '../components/HUD';
import './HubPage.css';

const ZONES = [
    { id: 'shop', emoji: '🏪', name: 'Shop', desc: 'Buy saplings, barrels & equipment', path: '/shop', color: '#C9A938', disabled: false },
    { id: 'vineyard', emoji: '🍇', name: 'Vineyard', desc: 'Plant, grow & harvest grapes', path: '/vineyard', color: '#6B8E23', disabled: false },
    { id: 'winery', emoji: '🛢️', name: 'Winery', desc: 'Ferment & age your wines', path: '/winery', color: '#8B4513', disabled: false },
    { id: 'academy', emoji: '🎓', name: 'Academy', desc: 'Coming soon...', path: '/academy', color: '#4A6FA5', disabled: true },
] as const;

export default function HubPage() {
    const navigate = useNavigate();

    return (
        <>
            <HUD />
            <div className="hub">
                {/* Chateau centerpiece */}
                <div className="hub-chateau fade-in">
                    <span className="hub-chateau-icon">🏰</span>
                    <h2 className="hub-chateau-name">Your Estate</h2>
                    <p className="hub-chateau-hint">Choose a location to visit</p>
                </div>

                {/* Zone grid */}
                <div className="hub-zones">
                    {ZONES.map((zone, i) => (
                        <button
                            key={zone.id}
                            className={`hub-zone fade-in ${zone.disabled ? 'hub-zone-disabled' : ''}`}
                            style={{ animationDelay: `${0.1 + i * 0.1}s`, '--zone-color': zone.color } as React.CSSProperties}
                            onClick={() => !zone.disabled && navigate(zone.path)}
                            disabled={zone.disabled}
                        >
                            <span className="hub-zone-emoji">{zone.emoji}</span>
                            <span className="hub-zone-name">{zone.name}</span>
                            <span className="hub-zone-desc">{zone.desc}</span>
                            {zone.disabled && <span className="hub-zone-badge">🔒</span>}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
