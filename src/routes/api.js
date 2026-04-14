import { Router } from 'express';
import { x402Middleware } from '../middleware/auth.js';
import { subscriptionGate } from '../middleware/subscription-gate.js';
import { recordApiUsage } from '../services/subscription.js';
import { getLatestAEI, getAEIHistory } from '../services/aei.js';
import { getLatestReputationTrends } from '../services/reputation-analyzer.js';
import { getLatestArbitrationSignals } from '../services/arbitration-analyzer.js';
import { getLatestKnowledgePrices } from '../services/knowledge-pricer.js';
import { getLatestGeneticSignals } from '../services/genetic-analyzer.js';

const router = Router();

const COST_PER_POINT = 0.001; // $0.001 per data point

const METRIC_HANDLERS = {
  aei: () => {
    const data = getLatestAEI();
    return { data, points: 1 };
  },
  aei_history: (params) => {
    const history = getAEIHistory(params.period || '24h', params.resolution || '5m');
    return { data: history, points: history.data_points.length };
  },
  reputation: () => {
    const data = getLatestReputationTrends();
    return { data, points: 1 };
  },
  arbitration: () => {
    const data = getLatestArbitrationSignals();
    return { data, points: 1 };
  },
  knowledge: () => {
    const data = getLatestKnowledgePrices();
    return { data, points: 1 };
  },
  genetics: () => {
    const data = getLatestGeneticSignals();
    return { data, points: 1 };
  },
};

// GET /v1/pulse/api/query — programmatic data access ($0.001/point)
router.get('/api/query', x402Middleware, subscriptionGate('api_access'), (req, res) => {
  try {
    const { metric, period, resolution } = req.query;

    if (!metric) {
      return res.status(400).json({
        error: 'metric parameter required',
        available_metrics: Object.keys(METRIC_HANDLERS),
      });
    }

    const handler = METRIC_HANDLERS[metric];
    if (!handler) {
      return res.status(400).json({
        error: `Unknown metric: ${metric}`,
        available_metrics: Object.keys(METRIC_HANDLERS),
      });
    }

    const result = handler({ period, resolution });
    const cost = result.points * COST_PER_POINT;

    // Record usage
    const did = req.authenticatedDID || 'anonymous';
    recordApiUsage(did, metric, result.points, cost);

    res.json({
      service: 'hivepulse',
      endpoint: 'api_query',
      metric,
      data: result.data,
      query_cost_usdc: cost,
      data_points: result.points,
    });
  } catch (err) {
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
});

export default router;
