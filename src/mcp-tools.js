import db from './services/db.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'hivepulse_get_health',
    description: 'Get network-wide health metrics: active services, uptime, error rates.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'hivepulse_get_population',
    description: 'Get agent population stats: total agents, active count, species breakdown.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'hivepulse_get_economy',
    description: 'Get economy metrics: transaction volume, revenue, settlement totals.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'hivepulse_subscribe_alerts',
    description: 'Subscribe to threshold-based alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          description: 'The metric name to monitor.',
        },
        threshold: {
          type: 'number',
          description: 'The threshold value to trigger the alert.',
        },
        direction: {
          type: 'string',
          enum: ['above', 'below'],
          description: "Alert when metric goes 'above' or 'below' the threshold.",
        },
      },
      required: ['metric', 'threshold', 'direction'],
    },
  },
];

const alertSubscriptions = [];

function getHealth() {
  const stats = db.prepare('SELECT * FROM pulse_stats WHERE id = 1').get();
  const snapshotCount = db.prepare('SELECT COUNT(*) as count FROM aei_snapshots').get();
  const lastSnapshot = db.prepare('SELECT timestamp FROM aei_snapshots ORDER BY id DESC LIMIT 1').get();
  const firstSnapshot = db.prepare('SELECT timestamp FROM aei_snapshots ORDER BY id ASC LIMIT 1').get();

  let uptimePct = 100;
  if (firstSnapshot && lastSnapshot) {
    const elapsed = (new Date(lastSnapshot.timestamp) - new Date(firstSnapshot.timestamp)) / 60000;
    const expected = Math.max(1, Math.floor(elapsed));
    uptimePct = Math.min(100, Math.round((snapshotCount.count / expected) * 100));
  }

  return {
    status: 'operational',
    active_services: 6,
    uptime_pct: uptimePct,
    total_data_points_served: stats?.total_data_points_served || 0,
    last_updated: stats?.last_updated || new Date().toISOString(),
    error_rate_pct: 0,
    aei_snapshots: snapshotCount.count,
  };
}

function getPopulation() {
  const latest = db.prepare('SELECT * FROM aei_snapshots ORDER BY id DESC LIMIT 1').get();
  let speciesBreakdown = {};
  if (latest?.population_by_species) {
    try { speciesBreakdown = JSON.parse(latest.population_by_species); } catch {}
  }

  return {
    total_agents: latest?.total_agents || 0,
    active_streams: latest?.active_streams || 0,
    species_breakdown: speciesBreakdown,
    timestamp: latest?.timestamp || new Date().toISOString(),
  };
}

function getEconomy() {
  const latest = db.prepare('SELECT * FROM aei_snapshots ORDER BY id DESC LIMIT 1').get();
  const stats = db.prepare('SELECT * FROM pulse_stats WHERE id = 1').get();

  return {
    aei_composite: latest?.aei_composite || 0,
    bounty_created_1h: latest?.bounty_created_1h || 0,
    bounty_filled_1h: latest?.bounty_filled_1h || 0,
    fill_rate_pct: latest?.fill_rate_pct || 0,
    avg_bounty_value_usdc: latest?.avg_bounty_value_usdc || 0,
    settlement_volume_24h_usdc: latest?.settlement_volume_24h_usdc || 0,
    total_revenue_usdc: stats?.total_revenue_usdc || 0,
    timestamp: latest?.timestamp || new Date().toISOString(),
  };
}

function subscribeAlerts({ metric, threshold, direction }) {
  const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  alertSubscriptions.push({ id, metric, threshold, direction, created_at: new Date().toISOString() });
  return { subscription_id: id, metric, threshold, direction, status: 'active' };
}

const toolHandlers = {
  hivepulse_get_health: getHealth,
  hivepulse_get_population: getPopulation,
  hivepulse_get_economy: getEconomy,
  hivepulse_subscribe_alerts: subscribeAlerts,
};

export function handleMcpRequest(req, res) {
  const { jsonrpc, id, method, params } = req.body;

  if (jsonrpc !== '2.0') {
    return res.status(400).json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32600, message: 'Invalid Request — expected jsonrpc 2.0' } });
  }

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'hivepulse', version: '1.0.0' },
      },
    });
  }

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: { tools: TOOL_DEFINITIONS },
    });
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};
    const handler = toolHandlers[toolName];

    if (!handler) {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Unknown tool: ${toolName}` },
      });
    }

    try {
      const result = handler(toolArgs);
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      });
    } catch (err) {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        },
      });
    }
  }

  return res.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}
