import db from './db.js';
import {
  getHiveForgeStats,
  getHiveForgeBounties,
  getHiveForgeSpecies,
  getHiveClearStats,
  getHiveBankStats,
  getHiveTrustStats,
  getHiveLawStats,
} from './cross-service.js';

// AEI composite weights
const WEIGHTS = {
  bounty_activity: 0.25,
  settlement_volume: 0.25,
  agent_growth: 0.15,
  reputation_health: 0.15,
  compliance_rate: 0.10,
  financial_activity: 0.10,
};

// Normalization ceilings (tuned for early ecosystem)
const CEILINGS = {
  bounty_activity: 200,      // bounties created+filled in 1h
  settlement_volume: 100000,  // 24h settlement volume in USDC
  agent_growth: 100,          // new agents in 24h
  reputation_health: 1000,    // max avg reputation
  compliance_rate: 1.0,       // 100%
  financial_activity: 50000,  // vault deposits + stream volume
};

let lastKnown = {
  bounty_created_1h: 0,
  bounty_filled_1h: 0,
  fill_rate_pct: 0,
  avg_bounty_value_usdc: 0,
  unfilled_by_category: {},
  population_by_species: {},
  settlement_volume_24h_usdc: 0,
  active_streams: 0,
  total_agents: 0,
  total_deposits_usdc: 0,
  stream_volume_usdc: 0,
  avg_reputation: 500,
  active_seals: 0,
  total_seals: 0,
};

function normalize(value, ceiling) {
  return Math.min(value / ceiling, 1.0);
}

function computeAEI(metrics) {
  const bountyActivity = normalize(
    metrics.bounty_created_1h + metrics.bounty_filled_1h,
    CEILINGS.bounty_activity
  );
  const settlementVolume = normalize(
    metrics.settlement_volume_24h_usdc,
    CEILINGS.settlement_volume
  );
  const agentGrowth = normalize(metrics.total_agents, CEILINGS.agent_growth);
  const reputationHealth = normalize(metrics.avg_reputation, CEILINGS.reputation_health);
  const complianceRate = metrics.total_seals > 0
    ? normalize(metrics.active_seals / metrics.total_seals, CEILINGS.compliance_rate)
    : 0.5;
  const financialActivity = normalize(
    metrics.total_deposits_usdc + metrics.stream_volume_usdc,
    CEILINGS.financial_activity
  );

  const composite = Math.round(
    (bountyActivity * WEIGHTS.bounty_activity +
      settlementVolume * WEIGHTS.settlement_volume +
      agentGrowth * WEIGHTS.agent_growth +
      reputationHealth * WEIGHTS.reputation_health +
      complianceRate * WEIGHTS.compliance_rate +
      financialActivity * WEIGHTS.financial_activity) *
    1000
  );

  return Math.max(0, Math.min(1000, composite));
}

export async function calculateAndStoreAEI() {
  try {
    const [forgeStats, bounties, species, clearStats, bankStats, trustStats, lawStats] =
      await Promise.allSettled([
        getHiveForgeStats(),
        getHiveForgeBounties(),
        getHiveForgeSpecies(),
        getHiveClearStats(),
        getHiveBankStats(),
        getHiveTrustStats(),
        getHiveLawStats(),
      ]);

    const forge = forgeStats.status === 'fulfilled' ? forgeStats.value : {};
    const bountyData = bounties.status === 'fulfilled' ? bounties.value : {};
    const speciesData = species.status === 'fulfilled' ? species.value : {};
    const clear = clearStats.status === 'fulfilled' ? clearStats.value : {};
    const bank = bankStats.status === 'fulfilled' ? bankStats.value : {};
    const trust = trustStats.status === 'fulfilled' ? trustStats.value : {};
    const law = lawStats.status === 'fulfilled' ? lawStats.value : {};

    // Update lastKnown with fresh data where available
    if (forgeStats.status === 'fulfilled') {
      lastKnown.bounty_created_1h = forge.total_bounties || lastKnown.bounty_created_1h;
      lastKnown.bounty_filled_1h = forge.bounties_filled || lastKnown.bounty_filled_1h;
      lastKnown.avg_bounty_value_usdc = forge.avg_bounty_value || lastKnown.avg_bounty_value_usdc;
      lastKnown.total_agents = forge.total_agents || lastKnown.total_agents;
    }
    if (bounties.status === 'fulfilled') {
      const bList = bountyData.bounties || [];
      const unfilled = {};
      bList.filter(b => b.status === 'open').forEach(b => {
        const cat = b.category || 'general';
        unfilled[cat] = (unfilled[cat] || 0) + 1;
      });
      lastKnown.unfilled_by_category = unfilled;
    }
    if (species.status === 'fulfilled') {
      const pop = {};
      (speciesData.species || []).forEach(s => {
        pop[s.name || s.species_id] = s.population || s.count || 1;
      });
      lastKnown.population_by_species = pop;
    }
    if (clearStats.status === 'fulfilled') {
      lastKnown.settlement_volume_24h_usdc = clear.settlement_volume_usdc || lastKnown.settlement_volume_24h_usdc;
    }
    if (bankStats.status === 'fulfilled') {
      lastKnown.active_streams = bank.active_streams || lastKnown.active_streams;
      lastKnown.total_deposits_usdc = bank.total_deposits_usdc || lastKnown.total_deposits_usdc;
      lastKnown.stream_volume_usdc = bank.stream_volume_usdc || lastKnown.stream_volume_usdc;
    }
    if (trustStats.status === 'fulfilled') {
      lastKnown.avg_reputation = trust.avg_reputation || lastKnown.avg_reputation;
    }
    if (lawStats.status === 'fulfilled') {
      lastKnown.active_seals = law.active_seals || lastKnown.active_seals;
      lastKnown.total_seals = law.total_seals || lastKnown.total_seals;
    }

    lastKnown.fill_rate_pct = lastKnown.bounty_created_1h > 0
      ? Math.round((lastKnown.bounty_filled_1h / lastKnown.bounty_created_1h) * 100)
      : 0;

    const aei_composite = computeAEI(lastKnown);
    const timestamp = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO aei_snapshots (
        timestamp, aei_composite, bounty_created_1h, bounty_filled_1h,
        fill_rate_pct, avg_bounty_value_usdc, unfilled_by_category,
        population_by_species, settlement_volume_24h_usdc, active_streams, total_agents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      timestamp,
      aei_composite,
      lastKnown.bounty_created_1h,
      lastKnown.bounty_filled_1h,
      lastKnown.fill_rate_pct,
      lastKnown.avg_bounty_value_usdc,
      JSON.stringify(lastKnown.unfilled_by_category),
      JSON.stringify(lastKnown.population_by_species),
      lastKnown.settlement_volume_24h_usdc,
      lastKnown.active_streams,
      lastKnown.total_agents
    );

    return { timestamp, aei_composite, ...lastKnown };
  } catch (err) {
    console.error('[AEI] Calculation error:', err.message);
    return null;
  }
}

export function getLatestAEI() {
  const row = db.prepare(
    'SELECT * FROM aei_snapshots ORDER BY id DESC LIMIT 1'
  ).get();

  if (!row) {
    return {
      timestamp: new Date().toISOString(),
      aei_composite: 0,
      bounty_created_1h: 0,
      bounty_filled_1h: 0,
      fill_rate_pct: 0,
      avg_bounty_value_usdc: 0,
      unfilled_by_category: {},
      population_by_species: {},
      settlement_volume_24h_usdc: 0,
      active_streams: 0,
      total_agents: 0,
    };
  }

  return {
    ...row,
    unfilled_by_category: JSON.parse(row.unfilled_by_category || '{}'),
    population_by_species: JSON.parse(row.population_by_species || '{}'),
  };
}

export function getAEIHistory(period = '24h', resolution = '5m') {
  const periodMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const resolutionMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  const since = new Date(Date.now() - (periodMs[period] || periodMs['24h'])).toISOString();
  const resMs = resolutionMs[resolution] || resolutionMs['5m'];

  const rows = db.prepare(
    'SELECT * FROM aei_snapshots WHERE timestamp >= ? ORDER BY timestamp ASC'
  ).all(since);

  // Downsample to requested resolution
  if (rows.length === 0) return { period, resolution, data_points: [] };

  const sampled = [];
  let lastBucket = 0;
  for (const row of rows) {
    const ts = new Date(row.timestamp).getTime();
    const bucket = Math.floor(ts / resMs);
    if (bucket !== lastBucket) {
      sampled.push({
        ...row,
        unfilled_by_category: JSON.parse(row.unfilled_by_category || '{}'),
        population_by_species: JSON.parse(row.population_by_species || '{}'),
      });
      lastBucket = bucket;
    }
  }

  return { period, resolution, data_points: sampled };
}

let aeiInterval = null;

export function startAEICalculator() {
  console.log('[AEI] Starting calculator (60s interval)');
  calculateAndStoreAEI();
  aeiInterval = setInterval(calculateAndStoreAEI, 60 * 1000);
}

export function stopAEICalculator() {
  if (aeiInterval) clearInterval(aeiInterval);
}
