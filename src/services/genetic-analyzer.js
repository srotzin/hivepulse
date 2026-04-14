import db from './db.js';
import { getHiveForgeFitness } from './cross-service.js';

export async function analyzeGenetics() {
  try {
    const data = await getHiveForgeFitness();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO genetic_signals (timestamp, top_species, trait_premiums, genetic_drift, offspring_survival_rate)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      timestamp,
      JSON.stringify(data.top_species || []),
      JSON.stringify(data.trait_premiums || []),
      JSON.stringify(data.genetic_drift || {}),
      data.offspring_survival_rate || 0
    );

    console.log('[Genetics] Analysis stored');
    return data;
  } catch (err) {
    console.error('[Genetics] Analysis error:', err.message);
    return null;
  }
}

export function getLatestGeneticSignals() {
  const row = db.prepare(
    'SELECT * FROM genetic_signals ORDER BY id DESC LIMIT 1'
  ).get();

  if (!row) {
    return {
      timestamp: new Date().toISOString(),
      top_species: [],
      trait_premiums: [],
      genetic_drift: {},
      offspring_survival_rate: 0,
    };
  }

  return {
    timestamp: row.timestamp,
    top_species: JSON.parse(row.top_species || '[]'),
    trait_premiums: JSON.parse(row.trait_premiums || '[]'),
    genetic_drift: JSON.parse(row.genetic_drift || '{}'),
    offspring_survival_rate: row.offspring_survival_rate,
  };
}

let geneticInterval = null;

export function startGeneticAnalyzer() {
  console.log('[Genetics] Starting analyzer (1h interval)');
  analyzeGenetics();
  geneticInterval = setInterval(analyzeGenetics, 60 * 60 * 1000);
}

export function stopGeneticAnalyzer() {
  if (geneticInterval) clearInterval(geneticInterval);
}
