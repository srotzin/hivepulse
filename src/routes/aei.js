import { Router } from 'express';
import { getLatestAEI, getAEIHistory } from '../services/aei.js';
import { getSubscription } from '../services/subscription.js';
import { optionalAuth, x402Middleware } from '../middleware/auth.js';
import { subscriptionGate } from '../middleware/subscription-gate.js';

const router = Router();

// GET /v1/pulse/aei — PUBLIC with 5-min cache (free tier hook)
let cachedAEI = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

router.get('/aei', optionalAuth, (req, res) => {
  try {
    // Paid/internal users get real-time data
    if (req.paymentVerified || (req.authenticatedDID && hasRealtimeAccess(req.authenticatedDID))) {
      const data = getLatestAEI();
      return res.json({
        service: 'hivepulse',
        endpoint: 'aei',
        realtime: true,
        ...data,
      });
    }

    // Free tier: 5-minute delayed cache
    const now = Date.now();
    if (!cachedAEI || (now - cacheTimestamp) > CACHE_TTL) {
      cachedAEI = getLatestAEI();
      cacheTimestamp = now;
    }

    res.json({
      service: 'hivepulse',
      endpoint: 'aei',
      realtime: false,
      delayed_by: '5m',
      ...cachedAEI,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AEI', details: err.message });
  }
});

// GET /v1/pulse/aei/history — requires subscription (builder+)
router.get('/aei/history', x402Middleware, subscriptionGate('aei_realtime'), (req, res) => {
  try {
    const { period = '24h', resolution = '5m' } = req.query;
    const history = getAEIHistory(period, resolution);
    res.json({
      service: 'hivepulse',
      endpoint: 'aei_history',
      ...history,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AEI history', details: err.message });
  }
});

function hasRealtimeAccess(did) {
  try {
    const sub = getSubscription(did);
    return sub && sub.features.includes('aei_realtime') && sub.status === 'active';
  } catch {
    return false;
  }
}

export default router;
