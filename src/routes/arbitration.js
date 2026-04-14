import { Router } from 'express';
import { getLatestArbitrationSignals } from '../services/arbitration-analyzer.js';
import { x402Middleware } from '../middleware/auth.js';
import { subscriptionGate } from '../middleware/subscription-gate.js';

const router = Router();

// GET /v1/pulse/arbitration/signals — professional+
router.get('/arbitration/signals', x402Middleware, subscriptionGate('arbitration_signals'), (req, res) => {
  try {
    const signals = getLatestArbitrationSignals();
    res.json({
      service: 'hivepulse',
      endpoint: 'arbitration_signals',
      ...signals,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch arbitration signals', details: err.message });
  }
});

export default router;
