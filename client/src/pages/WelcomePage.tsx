import { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import './WelcomePage.css';

export default function WelcomePage() {
    const { login, register } = usePlayerStore();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await register(username, password);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="welcome">
            {/* Decorative background layers */}
            <div className="welcome-bg">
                <div className="welcome-glow" />
                <div className="welcome-vines" />
            </div>

            <div className="welcome-content fade-in">
                <div className="welcome-logo">
                    <span className="welcome-icon">🏰</span>
                    <h1 className="welcome-title">Chateau Base</h1>
                    <p className="welcome-subtitle">Build your wine empire</p>
                </div>

                <form className="welcome-form card" onSubmit={handleSubmit}>
                    <div className="form-tabs">
                        <button
                            type="button"
                            className={`form-tab ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Enter Estate
                        </button>
                        <button
                            type="button"
                            className={`form-tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            New Vintner
                        </button>
                    </div>

                    <div className="form-fields">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            autoComplete="username"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {error && <div className="form-error">{error}</div>}

                    <button type="submit" className="btn btn-primary welcome-submit pulse" disabled={loading}>
                        {loading ? '...' : isLogin ? 'Enter the Estate' : 'Begin Your Journey'}
                    </button>

                    {!isLogin && (
                        <p className="form-hint">
                            You'll start with <strong>500 $CORK</strong> to build your vineyard
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
