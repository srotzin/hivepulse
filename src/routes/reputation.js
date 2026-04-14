import { Router } from 'express';
import { getLatestReputationTrends, getLeaderboard } from '../services/reputation-analyzer.js';
import { x402Middleware } from '../middleware/auth.js';
import { subscriptionGate } from '../middleware/subscription-gate.js';

const router = Router();

// GET /v1/pulse/reputation/trends — builder+
router.get('/reputation/trends', x402Middleware, subscriptionGate('reputation_trends'), (req, res) => {
  try {
    const trends = getLatestReputationTrends();
    res.json({
      service: 'hivepulse',
      endpoint: 'reputation_trends',
      ...trends,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reputation trends', details: err.message });
  }
});

// GET /v1/pulse/reputation/leaderboard — builder+
router.get('/reputation/leaderboard', x402Middleware, subscriptionGate('reputation_leaderboard'), async (req, res) => {
  try {
    const { species, jurisdiction, limit = 25 } = req.query;
    const params = {};
    if (species) params.species = species;
    if (jurisdiction) params.jurisdiction = jurisdiction;
    if (limit) params.limit = limit;

    const data = await getLeaderboard(params);
    res.json({
      service: 'hivepulse',
      endpoint: 'reputation_leaderboard',
      ...data,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: err.message });
  }
});

export default router;
