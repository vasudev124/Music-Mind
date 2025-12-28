import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TiltCard from './TiltCard';
import './Dashboard.css';

const MusicInsightsPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Mock Data
    const topSongs = Array(10).fill(null).map((_, i) => ({
        id: i, title: `Vibe Song ${i + 1}`, artist: `Artist ${i + 1}`, duration: '3:20'
    }));

    const topGenres = [
        { name: 'Lo-Fi Hip Hop', percent: 85 },
        { name: 'Indie Pop', percent: 70 },
        { name: 'Synthwave', percent: 60 },
        { name: 'Jazz', percent: 40 },
        { name: 'Classical', percent: 20 }
    ];

    const topArtists = [
        { id: 1, name: 'The Weeknd' },
        { id: 2, name: 'Daft Punk' },
        { id: 3, name: 'Tame Impala' },
        { id: 4, name: 'Arctic Monkeys' },
        { id: 5, name: 'Glass Animals' }
    ];

    return (
        <div className="dashboard-container visible" style={{ paddingTop: '100px' }}>
            <nav className="glass-panel navbar">
                <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
                <h2 className="logo">Music Insights</h2>
                <div className="user-profile">Music Lover</div>
            </nav>

            <main className="dashboard-grid" style={{ maxWidth: '1000px', gap: '3rem' }}>

                {/* Section 1: Top Songs */}
                <TiltCard className="glass-panel section-card" style={{ height: 'auto', minHeight: '400px', position: 'relative', top: '0', marginBottom: '0' }}>
                    <h3>Top Songs</h3>
                    <ul className="song-list">
                        {topSongs.map((song, i) => (
                            <li key={song.id} className="song-item">
                                <span className="rank">{i + 1}</span>
                                <div className="song-info">
                                    <div className="song-title">{song.title}</div>
                                    <div className="song-artist">{song.artist}</div>
                                </div>
                                <span>{song.duration}</span>
                            </li>
                        ))}
                    </ul>
                </TiltCard>

                {/* Section 2: Top Genres */}
                <TiltCard className="glass-panel section-card" style={{ height: 'auto', minHeight: '300px', position: 'relative', top: '0', marginBottom: '0' }}>
                    <h3>Top Genres</h3>
                    <div className="genre-bars">
                        {topGenres.map(g => (
                            <div key={g.name} className="genre-row">
                                <span>{g.name}</span>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${g.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TiltCard>

                {/* Section 3: Top Artists (NEW) */}
                <TiltCard className="glass-panel section-card" style={{ height: 'auto', minHeight: '300px', position: 'relative', top: '0', marginBottom: '0' }}>
                    <h3>Top Artists</h3>
                    <ul className="song-list">
                        {topArtists.map((artist, i) => (
                            <li key={artist.id} className="song-item" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                                <span className="rank">{i + 1}</span>
                                <div className="song-info">
                                    <div className="song-title" style={{ fontSize: '1.2rem' }}>{artist.name}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </TiltCard>

            </main>
        </div>
    );
};

export default MusicInsightsPage;
