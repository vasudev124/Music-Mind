import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingVinyl from './FloatingVinyl';
import './LandingPage.css';

const TypewriterText = ({ text, delay = 100, onComplete }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, delay);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, delay, text, onComplete]);

    return (
        <span>
            {displayText}
            <span className="cursor"></span>
        </span>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const [showLogin, setShowLogin] = useState(false);

    const handleLogin = () => {
        // Navigate to dashboard
        navigate('/dashboard');
    };

    return (
        <div className="landing-container">
            <FloatingVinyl />
            <div className="hero-content">

                <h1 className="hero-title">
                    <TypewriterText
                        text="Discover your sound."
                        delay={80}
                        onComplete={() => setShowLogin(true)}
                    />
                </h1>
                <p className="hero-subtitle">
                    {showLogin && <span className="fade-in">Analyze your Spotify music taste like never before.</span>}
                </p>

                {showLogin && (
                    <button className="login-btn fade-in" onClick={handleLogin}>
                        Login to Spotify
                    </button>
                )}
            </div>
        </div>
    );
};

export default LandingPage;
