import { Router } from 'express';
import { getLatestGeneticSignals } from '../services/genetic-analyzer.js';
import { x402Middleware } from '../middleware/auth.js';
import { subscriptionGate } from '../middleware/subscription-gate.js';

const router = Router();

// GET /v1/pulse/genetics/fitness — professional+
router.get('/genetics/fitness', x402Middleware, subscriptionGate('genetic_fitness'), (req, res) => {
  try {
    const signals = getLatestGeneticSignals();
    res.json({
      service: 'hivepulse',
      endpoint: 'genetic_fitness',
      ...signals,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch genetic fitness', details: err.message });
  }
});

export default router;
