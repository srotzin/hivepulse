import db from './db.js';
import { getHiveMindPrices } from './cross-service.js';

export async function analyzeKnowledgePrices() {
  try {
    const data = await getHiveMindPrices();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO knowledge_prices (timestamp, by_category, trending, citation_leaders)
      VALUES (?, ?, ?, ?)
    `).run(
      timestamp,
      JSON.stringify(data.by_category || []),
      JSON.stringify(data.trending || []),
      JSON.stringify(data.citation_leaders || [])
    );

    console.log('[Knowledge] Price analysis stored');
    return data;
  } catch (err) {
    console.error('[Knowledge] Price analysis error:', err.message);
    return null;
  }
}

export function getLatestKnowledgePrices() {
  const row = db.prepare(
    'SELECT * FROM knowledge_prices ORDER BY id DESC LIMIT 1'
  ).get();

  if (!row) {
    return {
      timestamp: new Date().toISOString(),
      by_category: [],
      trending: [],
      citation_leaders: [],
    };
  }

  return {
    timestamp: row.timestamp,
    by_category: JSON.parse(row.by_category || '[]'),
    trending: JSON.parse(row.trending || '[]'),
    citation_leaders: JSON.parse(row.citation_leaders || '[]'),
  };
}

let knowledgeInterval = null;

export function startKnowledgePricer() {
  console.log('[Knowledge] Starting pricer (1h interval)');
  analyzeKnowledgePrices();
  knowledgeInterval = setInterval(analyzeKnowledgePrices, 60 * 60 * 1000);
}

export function stopKnowledgePricer() {
  if (knowledgeInterval) clearInterval(knowledgeInterval);
}
