import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TiltCard from './TiltCard';
import './Dashboard.css'; // Reuse dashboard styles for consistency

const TopSongsPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        window.scrollTo(0, 0);
    }, []);

    // Mock data - in real app, might come from context or API
    const topSongs = Array(20).fill(null).map((_, i) => ({
        id: i,
        title: `Song Title ${i + 1}`,
        artist: `Artist Name ${i + 1}`,
        cover: `https://via.placeholder.com/50?text=${i + 1}`,
        duration: '3:45'
    }));

    return (
        <div className={`dashboard-container ${isVisible ? 'visible' : ''}`} style={{ paddingTop: '100px' }}>
            <nav className="glass-panel navbar">
                <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
                <h2 className="logo">Top Songs</h2>
                <div className="user-profile">Music Lover</div>
            </nav>

            <main className="dashboard-grid" style={{ maxWidth: '1000px' }}>
                <TiltCard className="glass-panel section-card" style={{ height: 'auto', minHeight: '80vh' }}>
                    <h3>Your Top Songs</h3>
                    <ul className="song-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                        {topSongs.map((song, i) => (
                            <li key={song.id} className="song-item" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="rank" style={{ marginRight: '1rem', width: '30px' }}>{i + 1}</span>
                                    <div className="song-info">
                                        <div className="song-title">{song.title}</div>
                                        <div className="song-artist">{song.artist}</div>
                                    </div>
                                </div>
                                <span style={{ color: 'var(--text-secondary)' }}>{song.duration}</span>
                            </li>
                        ))}
                    </ul>
                </TiltCard>
            </main>
        </div>
    );
};

export default TopSongsPage;
