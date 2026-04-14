import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const TIER_CONFIG = {
  free: {
    price_usdc_month: 0,
    features: ['aei_delayed'],
  },
  builder: {
    price_usdc_month: 99,
    features: ['aei_realtime', 'reputation_trends', 'reputation_leaderboard'],
  },
  professional: {
    price_usdc_month: 499,
    features: [
      'aei_realtime', 'reputation_trends', 'reputation_leaderboard',
      'arbitration_signals', 'knowledge_prices', 'genetic_fitness',
    ],
  },
  institutional: {
    price_usdc_month: 5000,
    features: [
      'aei_realtime', 'reputation_trends', 'reputation_leaderboard',
      'arbitration_signals', 'knowledge_prices', 'genetic_fitness',
      'firehose', 'api_access',
    ],
  },
};

export function createOrUpgradeSubscription(did, tier) {
  if (!TIER_CONFIG[tier]) {
    throw new Error(`Invalid tier: ${tier}. Valid tiers: ${Object.keys(TIER_CONFIG).join(', ')}`);
  }

  const config = TIER_CONFIG[tier];
  const now = new Date().toISOString();
  const activeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const existing = db.prepare('SELECT * FROM subscriptions WHERE did = ?').get(did);

  if (existing) {
    db.prepare(`
      UPDATE subscriptions SET tier = ?, price_usdc_month = ?, features = ?, active_until = ?, last_payment_at = ?
      WHERE did = ?
    `).run(tier, config.price_usdc_month, JSON.stringify(config.features), activeUntil, now, did);

    return {
      subscription_id: existing.subscription_id,
      did,
      tier,
      features: config.features,
      price_usdc_month: config.price_usdc_month,
      active_until: activeUntil,
      upgraded: true,
    };
  }

  const subscription_id = `sub_${uuidv4()}`;
  db.prepare(`
    INSERT INTO subscriptions (subscription_id, did, tier, price_usdc_month, features, status, created_at, active_until, last_payment_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `).run(subscription_id, did, tier, config.price_usdc_month, JSON.stringify(config.features), now, activeUntil, now);

  return {
    subscription_id,
    did,
    tier,
    features: config.features,
    price_usdc_month: config.price_usdc_month,
    active_until: activeUntil,
  };
}

export function getSubscription(did) {
  const row = db.prepare('SELECT * FROM subscriptions WHERE did = ?').get(did);
  if (!row) return null;

  return {
    ...row,
    features: JSON.parse(row.features || '[]'),
  };
}

export function getSubscriberCount() {
  const result = db.prepare('SELECT COUNT(*) as total FROM subscriptions WHERE status = ?').get('active');
  return result.total;
}

export function getSubscribersByTier() {
  const rows = db.prepare(
    "SELECT tier, COUNT(*) as count FROM subscriptions WHERE status = 'active' GROUP BY tier"
  ).all();
  const byTier = {};
  for (const row of rows) {
    byTier[row.tier] = row.count;
  }
  return byTier;
}

export function checkSubscriptionBilling() {
  const now = new Date().toISOString();
  const expired = db.prepare(
    "SELECT * FROM subscriptions WHERE active_until < ? AND status = 'active' AND tier != 'free'"
  ).all(now);

  for (const sub of expired) {
    db.prepare("UPDATE subscriptions SET status = 'expired' WHERE subscription_id = ?").run(sub.subscription_id);
    console.log(`[Billing] Expired subscription ${sub.subscription_id} for ${sub.did}`);
  }

  return { expired: expired.length };
}

export function recordApiUsage(did, query, dataPoints, costUsdc) {
  db.prepare(`
    INSERT INTO api_usage (did, query, data_points, cost_usdc, queried_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(did, query, dataPoints, costUsdc, new Date().toISOString());

  db.prepare(`
    UPDATE pulse_stats SET total_data_points_served = total_data_points_served + ?,
    total_revenue_usdc = total_revenue_usdc + ?, last_updated = ?
  `).run(dataPoints, costUsdc, new Date().toISOString());
}

let billingInterval = null;

export function startBillingChecker() {
  console.log('[Billing] Starting checker (24h interval)');
  checkSubscriptionBilling();
  billingInterval = setInterval(checkSubscriptionBilling, 24 * 60 * 60 * 1000);
}

export function stopBillingChecker() {
  if (billingInterval) clearInterval(billingInterval);
}

export { TIER_CONFIG };
