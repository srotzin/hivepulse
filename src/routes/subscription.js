import { Router } from 'express';
import { createOrUpgradeSubscription, getSubscription, TIER_CONFIG } from '../services/subscription.js';
import { x402Middleware } from '../middleware/auth.js';

const router = Router();

// POST /v1/pulse/subscribe — create or upgrade subscription
router.post('/subscribe', x402Middleware, (req, res) => {
  try {
    const { did, tier } = req.body;

    if (!did) {
      return res.status(400).json({ error: 'did is required' });
    }
    if (!tier) {
      return res.status(400).json({ error: 'tier is required', valid_tiers: Object.keys(TIER_CONFIG) });
    }

    const result = createOrUpgradeSubscription(did, tier);
    res.status(result.upgraded ? 200 : 201).json({
      service: 'hivepulse',
      endpoint: 'subscribe',
      ...result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /v1/pulse/subscription/:did — check subscription status
router.get('/subscription/:did', x402Middleware, (req, res) => {
  try {
    const sub = getSubscription(req.params.did);
    if (!sub) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: `No subscription found for DID: ${req.params.did}`,
      });
    }

    res.json({
      service: 'hivepulse',
      endpoint: 'subscription_status',
      ...sub,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscription', details: err.message });
  }
});

export default router;
