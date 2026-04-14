import { getSubscription } from '../services/subscription.js';

const FEATURE_MAP = {
  '/v1/pulse/aei': 'aei_delayed',
  '/v1/pulse/aei/history': 'aei_realtime',
  '/v1/pulse/reputation/trends': 'reputation_trends',
  '/v1/pulse/reputation/leaderboard': 'reputation_leaderboard',
  '/v1/pulse/arbitration/signals': 'arbitration_signals',
  '/v1/pulse/knowledge/prices': 'knowledge_prices',
  '/v1/pulse/genetics/fitness': 'genetic_fitness',
  '/v1/pulse/firehose': 'firehose',
  '/v1/pulse/api/query': 'api_access',
};

export function subscriptionGate(requiredFeature) {
  return (req, res, next) => {
    // Internal key bypass
    if (req.paymentVerified && req.paymentNote === 'internal_key_bypass') {
      return next();
    }

    // x402 payment bypass
    if (req.paymentVerified && req.paymentAmount > 0) {
      return next();
    }

    // Check subscription
    const did = req.authenticatedDID;
    if (!did) {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Subscription or payment required for this endpoint',
        required_feature: requiredFeature,
        subscribe_url: '/v1/pulse/subscribe',
      });
    }

    const sub = getSubscription(did);
    if (!sub || sub.status !== 'active') {
      return res.status(402).json({
        error: 'Subscription Required',
        message: 'Active subscription required for this endpoint',
        required_feature: requiredFeature,
        subscribe_url: '/v1/pulse/subscribe',
      });
    }

    // Check if subscription tier includes the required feature
    if (!sub.features.includes(requiredFeature)) {
      return res.status(403).json({
        error: 'Insufficient Tier',
        message: `Your ${sub.tier} subscription does not include ${requiredFeature}`,
        current_tier: sub.tier,
        required_feature: requiredFeature,
        upgrade_url: '/v1/pulse/subscribe',
      });
    }

    // Check expiration
    if (new Date(sub.active_until) < new Date()) {
      return res.status(402).json({
        error: 'Subscription Expired',
        message: 'Your subscription has expired. Please renew.',
        subscribe_url: '/v1/pulse/subscribe',
      });
    }

    req.subscription = sub;
    next();
  };
}
