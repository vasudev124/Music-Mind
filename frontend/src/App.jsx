import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import TopSongsPage from './components/TopSongsPage';
import MusicInsightsPage from './components/MusicInsightsPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/top-songs" element={<TopSongsPage />} />
      <Route path="/music-insights" element={<MusicInsightsPage />} />
    </Routes>
  );
}

export default App;
