const SERVICE_URLS = {
  hivetrust: process.env.HIVETRUST_URL || 'https://hivetrust.onrender.com',
  hivelaw: process.env.HIVELAW_URL || 'https://hivelaw.onrender.com',
  hiveforge: process.env.HIVEFORGE_URL || 'https://hiveforge-lhu4.onrender.com',
  hivemind: process.env.HIVEMIND_URL || 'https://hivemind-1-52cw.onrender.com',
  hiveclear: process.env.HIVECLEAR_URL || 'https://hiveclear.onrender.com',
  hivebank: process.env.HIVEBANK_URL || 'https://hivebank.onrender.com',
  hivegate: process.env.HIVEGATE_URL || 'https://hivegate.onrender.com',
  hiveconsciousness: process.env.HIVECONSCIOUSNESS_URL || 'https://hiveconsciousness.onrender.com',
  hiveecho: process.env.HIVEECHO_URL || 'https://hiveecho.onrender.com',
};

const INTERNAL_KEY = process.env.HIVE_INTERNAL_KEY || '';

async function callService(service, endpoint, options = {}) {
  const baseUrl = SERVICE_URLS[service];
  if (!baseUrl) throw new Error(`Unknown service: ${service}`);

  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-hive-internal': INTERNAL_KEY,
        'x-hive-internal-key': INTERNAL_KEY,
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`${service} ${endpoint} returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (options.fallback !== undefined) {
      return options.fallback;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Resilient wrappers — return reasonable defaults when services are unavailable

export async function getHiveTrustStats() {
  return callService('hivetrust', '/v1/trust/stats', {
    fallback: {
      total_dids: 0,
      avg_reputation: 500,
      total_bonds: 0,
      jurisdiction_count: 0,
    },
  });
}

export async function getHiveTrustLeaderboard(params = {}) {
  const query = new URLSearchParams(params).toString();
  return callService('hivetrust', `/v1/trust/leaderboard${query ? '?' + query : ''}`, {
    fallback: { leaders: [] },
  });
}

export async function getHiveTrustReputation() {
  return callService('hivetrust', '/v1/trust/reputation/trends', {
    fallback: {
      capability_premiums: [],
      dispute_trends: [],
      jurisdiction_scores: [],
      credit_default_rates: {},
    },
  });
}

export async function getHiveLawStats() {
  return callService('hivelaw', '/v1/law/stats', {
    fallback: {
      total_disputes: 0,
      resolved_disputes: 0,
      avg_resolution_time_ms: 0,
      avg_cost_usdc: 0,
      total_seals: 0,
      active_seals: 0,
    },
  });
}

export async function getHiveLawArbitration() {
  return callService('hivelaw', '/v1/law/arbitration/signals', {
    fallback: {
      most_disputed_terms: [],
      winning_evidence_types: [],
      jurisdiction_bias: {},
      avg_resolution_time_ms: 0,
      avg_cost_usdc: 0,
    },
  });
}

export async function getHiveForgeStats() {
  return callService('hiveforge', '/v1/forge/stats', {
    fallback: {
      total_species: 0,
      total_agents: 0,
      total_bounties: 0,
      bounties_filled: 0,
      avg_bounty_value: 0,
    },
  });
}

export async function getHiveForgeBounties() {
  return callService('hiveforge', '/v1/forge/bounties', {
    fallback: { bounties: [] },
  });
}

export async function getHiveForgeSpecies() {
  return callService('hiveforge', '/v1/forge/species', {
    fallback: { species: [] },
  });
}

export async function getHiveForgeFitness() {
  return callService('hiveforge', '/v1/forge/genetics/fitness', {
    fallback: {
      top_species: [],
      trait_premiums: [],
      genetic_drift: {},
      offspring_survival_rate: 0,
    },
  });
}

export async function getHiveMindStats() {
  return callService('hivemind', '/v1/mind/stats', {
    fallback: {
      total_memories: 0,
      total_citations: 0,
      marketplace_volume: 0,
    },
  });
}

export async function getHiveMindPrices() {
  return callService('hivemind', '/v1/mind/marketplace/prices', {
    fallback: {
      by_category: [],
      trending: [],
      citation_leaders: [],
    },
  });
}

export async function getHiveClearStats() {
  return callService('hiveclear', '/v1/clear/stats', {
    fallback: {
      total_settlements: 0,
      settlement_volume_usdc: 0,
      pending_settlements: 0,
    },
  });
}

export async function getHiveBankStats() {
  return callService('hivebank', '/v1/bank/stats', {
    fallback: {
      total_vaults: 0,
      total_deposits_usdc: 0,
      active_streams: 0,
      stream_volume_usdc: 0,
    },
  });
}

export async function getHiveGateStats() {
  return callService('hivegate', '/v1/gate/stats', {
    fallback: {
      total_guests: 0,
      total_translations: 0,
      total_bridges: 0,
    },
  });
}

export { callService, SERVICE_URLS };
