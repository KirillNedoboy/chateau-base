import { usePlayerStore } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';
import './HUD.css';

export default function HUD() {
    const { player, logout } = usePlayerStore();
    const navigate = useNavigate();

    if (!player) return null;

    return (
        <header className="hud">
            <div className="hud-left" onClick={() => navigate('/hub')} role="button" tabIndex={0}>
                <span className="hud-logo">🏰</span>
                <span className="hud-title">Chateau Base</span>
            </div>

            <div className="hud-right">
                <div className="hud-balance">
                    <span className="cork-icon">🪙</span>
                    <span className="cork-amount">{player.corkBalance.toLocaleString()}</span>
                    <span className="cork-label">$CORK</span>
                </div>

                <div className="hud-player">
                    <span className="hud-username">{player.username}</span>
                    <span className="hud-level">Lv.{player.level}</span>
                </div>

                <button className="hud-logout" onClick={logout} title="Logout">⏻</button>
            </div>
        </header>
    );
}
