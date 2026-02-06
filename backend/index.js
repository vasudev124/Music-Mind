const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('MusicMind backend running');
});

// 🔥 Search route placeholder (we will connect ML later)
app.post('/api/search', async (req, res) => {
  res.json({
    message: 'Search route connected',
    query: req.body.query
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
