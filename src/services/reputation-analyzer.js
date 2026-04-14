import db from './db.js';
import { getHiveTrustReputation, getHiveTrustLeaderboard } from './cross-service.js';

export async function analyzeReputation() {
  try {
    const data = await getHiveTrustReputation();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO reputation_trends (timestamp, capability_premiums, dispute_trends, jurisdiction_scores, credit_default_rates)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      timestamp,
      JSON.stringify(data.capability_premiums || []),
      JSON.stringify(data.dispute_trends || []),
      JSON.stringify(data.jurisdiction_scores || []),
      JSON.stringify(data.credit_default_rates || {})
    );

    console.log('[Reputation] Analysis stored');
    return data;
  } catch (err) {
    console.error('[Reputation] Analysis error:', err.message);
    return null;
  }
}

export function getLatestReputationTrends() {
  const row = db.prepare(
    'SELECT * FROM reputation_trends ORDER BY id DESC LIMIT 1'
  ).get();

  if (!row) {
    return {
      timestamp: new Date().toISOString(),
      capability_premiums: [],
      dispute_trends: [],
      jurisdiction_scores: [],
      credit_default_rates: {},
    };
  }

  return {
    timestamp: row.timestamp,
    capability_premiums: JSON.parse(row.capability_premiums || '[]'),
    dispute_trends: JSON.parse(row.dispute_trends || '[]'),
    jurisdiction_scores: JSON.parse(row.jurisdiction_scores || '[]'),
    credit_default_rates: JSON.parse(row.credit_default_rates || '{}'),
  };
}

export async function getLeaderboard(params = {}) {
  try {
    const data = await getHiveTrustLeaderboard(params);
    return data;
  } catch {
    return { leaders: [] };
  }
}

let reputationInterval = null;

export function startReputationAnalyzer() {
  console.log('[Reputation] Starting analyzer (1h interval)');
  analyzeReputation();
  reputationInterval = setInterval(analyzeReputation, 60 * 60 * 1000);
}

export function stopReputationAnalyzer() {
  if (reputationInterval) clearInterval(reputationInterval);
}
