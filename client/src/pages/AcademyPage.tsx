import { useNavigate } from 'react-router-dom';
import HUD from '../components/HUD';
import './GamePage.css';

export default function AcademyPage() {
    const navigate = useNavigate();

    return (
        <>
            <HUD />
            <div className="page academy-page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/hub')}>←</button>
                    <h1>🎓 Academy</h1>
                </div>

                <div className="academy-content fade-in">
                    <span className="academy-icon">📚</span>
                    <h2 className="academy-title">Coming Soon</h2>
                    <p className="academy-desc">
                        The Wine Academy is being prepared. Here you'll learn about grape varieties,
                        terroir, vinification techniques, and take tests to unlock rare items.
                    </p>
                    <button className="btn" onClick={() => navigate('/hub')}>
                        ← Back to Estate
                    </button>
                </div>
            </div>
        </>
    );
}
