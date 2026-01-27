import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useDashboardData from '../hooks/useDashboardData';

import HeroSection from './HeroSection';
import TiltCard from './TiltCard';

import friendsBg from '../assets/card_friends_bg_final.png';
import recsBg from '../assets/card_recs_bg.png';

import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const { data: dashboardData, loading, error } = useDashboardData();

  // ✅ Backend-aligned data
  const genres = dashboardData?.genres || [];
  const moodScore = dashboardData?.moodScore ?? null;
  const topTracks = dashboardData?.topTracks || [];

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll < 400) setActiveSection(0);
      else if (currentScroll < 900) setActiveSection(1);
      else setActiveSection(2);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return <div className="dashboard-container visible">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-container visible">{error}</div>;
  }

  return (
    <div className={`dashboard-container ${isVisible ? 'visible' : ''}`}>
      <div className="dashboard-background-layer" data-section={activeSection}>
        <div className="dashboard-noise"></div>
        <div className="dashboard-orb orb-1"></div>
        <div className="dashboard-orb orb-2"></div>
        <div className="dashboard-orb orb-3"></div>
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

        {/* -------- MUSIC INSIGHTS -------- */}
        <div className="section-wrapper" style={{ position: 'sticky', top: '120px', zIndex: 1, width: '884px' }}>
          <TiltCard className="glass-panel section-card insights-card">
            <div className="card-content-relative">
              <h3>Music Insights</h3>

              {/* ✅ Mood Score Proof */}
              {moodScore !== null && (
                <p style={{ marginBottom: '12px', opacity: 0.8 }}>
                  Mood Score: <strong>{moodScore}</strong>
                </p>
              )}

              <div className="genre-bars">
                {genres.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No genre data available
                  </p>
                )}

                {genres.map((g) => (
                  <div key={g.name} className="genre-row">
                    <span>{g.name}</span>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${g.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="explore-btn" onClick={() => navigate('/music-insights')}>
                View Full Insights
              </button>
            </div>
          </TiltCard>
        </div>

        {/* -------- FRIENDS (DISABLED FOR NOW) -------- */}
        <div className="section-wrapper" style={{ position: 'sticky', top: '120px', zIndex: 2, width: '884px' }}>
          <TiltCard
            className="glass-panel section-card friends-card"
            style={{ '--friends-bg': `url(${friendsBg})` }}
          >
            <h3>Compare with Friends</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Friends feature coming soon
            </p>
            <button className="explore-btn" disabled>
              Find Friends
            </button>
          </TiltCard>
        </div>

        {/* -------- RECOMMENDATIONS (DISABLED FOR NOW) -------- */}
        <div className="section-wrapper" style={{ position: 'sticky', top: '120px', zIndex: 3, width: '884px' }}>
          <TiltCard
            className="glass-panel section-card recs-section"
            style={{ '--recs-bg': `url(${recsBg})` }}
          >
            <h3>Recommendations</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Recommendations coming soon
            </p>
            <button className="explore-btn" disabled>
              Start Listening
            </button>
          </TiltCard>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
