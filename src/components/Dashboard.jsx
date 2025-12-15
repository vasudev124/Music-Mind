import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TiltCard from './TiltCard';
import HeroSection from './HeroSection';
import './Dashboard.css';

import friendsBg from '../assets/card_friends_bg_final.png';
import recsBg from '../assets/card_recs_bg.png';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [activeSection, setActiveSection] = useState(0);
    const vinylRef = React.useRef(null);

    useEffect(() => {
        setIsVisible(true);
        const handleScroll = () => {
            const currentScroll = window.scrollY;

            // Direct DOM manipulation for smooth vinyl animation (No Re-renders!)
            if (vinylRef.current) {
                const rotation = 20 + currentScroll * 0.05;
                const scale = 1 + activeSection * 0.05;
                vinylRef.current.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            }

            // Determine active section (Throttle this if needed, but state updates are less frequent here)
            if (currentScroll < 400) {
                setActiveSection(0);
            } else if (currentScroll < 900) {
                setActiveSection(1);
            } else {
                setActiveSection(2);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeSection]); // Depend on activeSection for correct scale calc inside closure

    const topSongs = Array(10).fill(null).map((_, i) => ({
        id: i,
        title: `Song Title ${i + 1}`,
        artist: `Artist Name ${i + 1}`,
        cover: `https://via.placeholder.com/50?text=${i + 1}`
    }));

    // ... (Data Arrays - kept same)
    const genres = [
        { name: 'Pop', percent: 80 },
        { name: 'Rock', percent: 60 },
        { name: 'Hip-Hop', percent: 45 },
        { name: 'Jazz', percent: 30 }
    ];

    const friends = [
        { name: 'Alice', match: '95%' },
        { name: 'Bob', match: '82%' },
        { name: 'Charlie', match: '60%' }
    ];

    const recommendations = Array(5).fill(null).map((_, i) => ({
        id: i,
        title: `New Gem ${i + 1}`,
        artist: `Undiscovered Artist`,
        link: 'https://open.spotify.com'
    }));

    return (
        <div className={`dashboard-container ${isVisible ? 'visible' : ''}`}>
            {/* Ambient Background Layer */}
            <div
                className="dashboard-background-layer"
                data-section={activeSection}
            >
                <div className="dashboard-noise"></div>
                <div className="dashboard-orb orb-1"></div>
                <div className="dashboard-orb orb-2"></div>
                <div className="dashboard-orb orb-3"></div>
                {/* Vinyl removed per user request */}
            </div>

            <nav className="navbar">
                <h2 className="logo">MusicMind</h2>
                <div className="nav-links">
                    <span className="nav-item active">Dashboard</span>
                    <span className="nav-item">Friends</span>
                    <span className="nav-item">Recommendations</span>
                    <span className="nav-item">Profile</span>
                </div>
            </nav>

            <HeroSection />

            <main className="dashboard-grid">
                {/* Music Insights (Consolidated) - Top: 100px (+ 100vh offset mostly) */}
                <div className="section-wrapper" style={{ position: 'sticky', top: '120px', zIndex: 1, width: '884px' }}>
                    <TiltCard className="glass-panel section-card insights-card">
                        {/* Grunge Background Layer */}
                        <div className="card-bg-layer" style={{
                            backgroundImage: 'url(/src/assets/card_insights_bg.png)',
                            opacity: 0.6
                        }}></div>

                        <div className="card-content-relative">
                            <h3>Music Insights</h3>

                            {/* Empty space for the background graphic to shine */}
                            <div style={{ flex: 1 }}></div>

                            <button className="explore-btn" onClick={() => navigate('/music-insights')}>View Full Insights</button>
                        </div>
                    </TiltCard>
                </div>

                {/* Friends Comparison - Top: 180px */}
                <div className="section-wrapper" style={{ position: 'sticky', top: '120px', zIndex: 2, width: '884px' }}>
                    <TiltCard
                        className="glass-panel section-card friends-card"
                        style={{ '--friends-bg': `url(${friendsBg})` }}
                    >
                        <h3>Compare with Friends</h3>
                        {/* Empty space for background */}
                        <div style={{ flex: 1 }}></div>
                        <button className="explore-btn">Find Friends</button>
                    </TiltCard>
                </div>

                {/* Recommendations - Top: 220px */}
                <div className="section-wrapper" style={{ position: 'sticky', top: '120px', zIndex: 3, width: '884px' }}>
                    <TiltCard
                        className="glass-panel section-card recs-section"
                        style={{ '--recs-bg': `url(${recsBg})` }}
                    >
                        {/* Pure Image Card */}
                    </TiltCard>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
