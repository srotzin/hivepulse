import db from './db.js';
import { getHiveLawArbitration } from './cross-service.js';

export async function analyzeArbitration() {
  try {
    const data = await getHiveLawArbitration();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO arbitration_signals (timestamp, most_disputed_terms, winning_evidence_types, jurisdiction_bias, avg_resolution_time_ms, avg_cost_usdc)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      timestamp,
      JSON.stringify(data.most_disputed_terms || []),
      JSON.stringify(data.winning_evidence_types || []),
      JSON.stringify(data.jurisdiction_bias || {}),
      data.avg_resolution_time_ms || 0,
      data.avg_cost_usdc || 0
    );

    console.log('[Arbitration] Analysis stored');
    return data;
  } catch (err) {
    console.error('[Arbitration] Analysis error:', err.message);
    return null;
  }
}

export function getLatestArbitrationSignals() {
  const row = db.prepare(
    'SELECT * FROM arbitration_signals ORDER BY id DESC LIMIT 1'
  ).get();

  if (!row) {
    return {
      timestamp: new Date().toISOString(),
      most_disputed_terms: [],
      winning_evidence_types: [],
      jurisdiction_bias: {},
      avg_resolution_time_ms: 0,
      avg_cost_usdc: 0,
    };
  }

  return {
    timestamp: row.timestamp,
    most_disputed_terms: JSON.parse(row.most_disputed_terms || '[]'),
    winning_evidence_types: JSON.parse(row.winning_evidence_types || '[]'),
    jurisdiction_bias: JSON.parse(row.jurisdiction_bias || '{}'),
    avg_resolution_time_ms: row.avg_resolution_time_ms,
    avg_cost_usdc: row.avg_cost_usdc,
  };
}

let arbitrationInterval = null;

export function startArbitrationAnalyzer() {
  console.log('[Arbitration] Starting analyzer (1h interval)');
  analyzeArbitration();
  arbitrationInterval = setInterval(analyzeArbitration, 60 * 60 * 1000);
}

export function stopArbitrationAnalyzer() {
  if (arbitrationInterval) clearInterval(arbitrationInterval);
}
