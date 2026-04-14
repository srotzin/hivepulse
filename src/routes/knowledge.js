import { Router } from 'express';
import { getLatestKnowledgePrices } from '../services/knowledge-pricer.js';
import { x402Middleware } from '../middleware/auth.js';
import { subscriptionGate } from '../middleware/subscription-gate.js';

const router = Router();

// GET /v1/pulse/knowledge/prices — professional+
router.get('/knowledge/prices', x402Middleware, subscriptionGate('knowledge_prices'), (req, res) => {
  try {
    const prices = getLatestKnowledgePrices();
    res.json({
      service: 'hivepulse',
      endpoint: 'knowledge_prices',
      ...prices,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge prices', details: err.message });
  }
});

export default router;
