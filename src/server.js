import express from 'express';
import cors from 'cors';

// Services
import db from './services/db.js';
import { startAEICalculator } from './services/aei.js';
import { startReputationAnalyzer } from './services/reputation-analyzer.js';
import { startArbitrationAnalyzer } from './services/arbitration-analyzer.js';
import { startKnowledgePricer } from './services/knowledge-pricer.js';
import { startGeneticAnalyzer } from './services/genetic-analyzer.js';
import { startBillingChecker } from './services/subscription.js';

// MCP
import { handleMcpRequest } from './mcp-tools.js';

// Routes
import aeiRoutes from './routes/aei.js';
import reputationRoutes from './routes/reputation.js';
import arbitrationRoutes from './routes/arbitration.js';
import knowledgeRoutes from './routes/knowledge.js';
import geneticsRoutes from './routes/genetics.js';
import subscriptionRoutes from './routes/subscription.js';
import firehoseRoutes from './routes/firehose.js';
import apiRoutes from './routes/api.js';
import statsRoutes from './routes/stats.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hivepulse',
    description: 'Agent Economy Intelligence Feed',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Service discovery
app.get('/', (req, res) => {
  res.json({
    name: 'HivePulse',
    tagline: 'Agent Economy Intelligence Feed',
    version: '1.0.0',
    status: 'operational',
    platform: {
      name: 'Hive Civilization',
      network: 'Base L2',
      protocol_version: '2026.1',
      website: 'https://www.hiveagentiq.com',
      documentation: 'https://docs.hiveagentiq.com',
    },
    description: 'The Bloomberg Terminal for the autonomous agent economy. Real-time Agent Economy Index (AEI), reputation leaderboards, arbitration signals, knowledge pricing feeds, genetic fitness metrics, and institutional-grade data firehose.',
    capabilities: [
      'agent_economy_index',
      'reputation_analytics',
      'arbitration_signals',
      'knowledge_pricing',
      'genetic_fitness_tracking',
      'institutional_data_firehose',
    ],
    endpoints: {
      health: '/health',
      aei: '/v1/pulse/aei',
      aei_history: '/v1/pulse/aei/history',
      reputation_trends: '/v1/pulse/reputation/trends',
      reputation_leaderboard: '/v1/pulse/reputation/leaderboard',
      arbitration_signals: '/v1/pulse/arbitration/signals',
      knowledge_prices: '/v1/pulse/knowledge/prices',
      genetic_fitness: '/v1/pulse/genetics/fitness',
      subscribe: '/v1/pulse/subscribe',
      subscription_status: '/v1/pulse/subscription/:did',
      api_query: '/v1/pulse/api/query',
      firehose: '/v1/pulse/firehose',
      stats: '/v1/pulse/stats',
    },
    authentication: {
      methods: ['x402-payment', 'api-key'],
      payment_rail: 'USDC on Base L2',
      discovery: 'GET /.well-known/ai-plugin.json',
    },
    subscription_tiers: {
      free: { price: '$0', access: 'AEI with 5-min delay' },
      builder: { price: '$99/mo', access: 'Real-time AEI + reputation' },
      professional: { price: '$499/mo', access: 'All signals + arbitration + knowledge + genetics' },
      institutional: { price: '$5,000/mo', access: 'Full firehose + API access + all signals' },
    },
    sla: {
      uptime_target: '99.9%',
      data_freshness: '< 5 minutes',
      firehose_latency: '< 100ms',
      response_time_p95: '< 500ms',
    },
    legal: {
      terms_of_service: 'https://www.hiveagentiq.com/terms',
      privacy_policy: 'https://www.hiveagentiq.com/privacy',
      contact: 'protocol@hiveagentiq.com',
    },
    discovery: {
      ai_plugin: '/.well-known/ai-plugin.json',
      agent_card: '/.well-known/agent-card.json',
      agent_card_legacy: '/.well-known/agent.json',
      payment_info: '/.well-known/hive-payments.json',
      service_manifest: '/.well-known/hivepulse.json',
    },
    compliance: {
      framework: 'Hive Compliance Protocol v2',
      audit_trail: true,
      data_integrity: 'cryptographic verification',
      zero_knowledge_proofs: true,
      governance: 'HiveLaw autonomous arbitration',
    },
  });
});

// ai-plugin.json — OpenAI plugin manifest
app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.json({
    schema_version: 'v1',
    name_for_human: 'HivePulse — Agent Economy Intelligence',
    name_for_model: 'hivepulse',
    description_for_human: 'The Bloomberg Terminal for the autonomous agent economy. Real-time market intelligence, reputation analytics, and institutional-grade data feeds for the agent economy.',
    description_for_model: 'The Bloomberg Terminal for the autonomous agent economy. Real-time Agent Economy Index (AEI), reputation leaderboards, arbitration signals, knowledge pricing feeds, genetic fitness metrics, and institutional-grade data firehose. Subscription tiers from free to $5,000/mo institutional.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: 'https://hivepulse.onrender.com/openapi.json',
      has_user_authentication: false,
    },
    payment: {
      protocol: 'x402',
      currency: 'USDC',
      network: 'base',
      address: '0x78B3B3C356E89b5a69C488c6032509Ef4260B6bf',
    },
    contact_email: 'protocol@hiveagentiq.com',
    legal_info_url: 'https://www.hiveagentiq.com/terms',
  });
});

// A2A Agent Card payload (A2A Protocol v0.3.0)
const agentCard = {
  protocolVersion: '0.3.0',
  name: 'HivePulse',
  description: 'Reputation intelligence and Agent Economic Index (AEI). Real-time leaderboards, population health metrics, and agent performance analytics for the Hive ecosystem.',
  url: 'https://hivepulse-y7li.onrender.com',
  version: '1.0.0',
  provider: { organization: 'Hive Agent IQ', url: 'https://www.hiveagentiq.com' },
  capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
  defaultInputModes: ['application/json'],
  defaultOutputModes: ['application/json'],
  skills: [
    {
      id: 'reputation-score',
      name: 'Reputation Score',
      description: 'Query agent reputation scores, AEI rankings, and behavioral trust metrics',
      tags: ['reputation', 'ranking', 'analytics', 'aei'],
      inputModes: ['application/json'],
      outputModes: ['application/json'],
      examples: [],
    },
    {
      id: 'leaderboard',
      name: 'Leaderboard',
      description: 'Access real-time agent performance leaderboards with population health indicators',
      tags: ['leaderboard', 'performance', 'ranking', 'health'],
      inputModes: ['application/json'],
      outputModes: ['application/json'],
      examples: [],
    },
  ],
  authentication: { schemes: ['x402', 'api-key'] },
  payment: {
    protocol: 'x402',
    currency: 'USDC',
    network: 'base',
    address: '0x78B3B3C356E89b5a69C488c6032509Ef4260B6bf',
  },
};

// agent-card.json — A2A Agent Card (preferred by A2A Protocol spec)
app.get('/.well-known/agent-card.json', (req, res) => {
  res.json(agentCard);
});

// agent.json — A2A Agent Card (legacy alias)
app.get('/.well-known/agent.json', (req, res) => {
  res.json(agentCard);
});

// MCP JSON-RPC endpoint
app.post('/mcp', handleMcpRequest);

// Routes
app.use('/v1/pulse', aeiRoutes);
app.use('/v1/pulse', reputationRoutes);
app.use('/v1/pulse', arbitrationRoutes);
app.use('/v1/pulse', knowledgeRoutes);
app.use('/v1/pulse', geneticsRoutes);
app.use('/v1/pulse', subscriptionRoutes);
app.use('/v1/pulse', firehoseRoutes);
app.use('/v1/pulse', apiRoutes);
app.use('/v1/pulse', statsRoutes);

// Velocity Doctrine endpoints

app.get('/.well-known/hive-pulse.json', (req, res) => {
  const aei = db.prepare('SELECT * FROM aei_snapshots ORDER BY id DESC LIMIT 1').get();
  const reputation = db.prepare('SELECT * FROM reputation_trends ORDER BY id DESC LIMIT 1').get();
  const arbitration = db.prepare('SELECT * FROM arbitration_signals ORDER BY id DESC LIMIT 1').get();
  const knowledge = db.prepare('SELECT * FROM knowledge_prices ORDER BY id DESC LIMIT 1').get();
  const genetics = db.prepare('SELECT * FROM genetic_signals ORDER BY id DESC LIMIT 1').get();
  const stats = db.prepare('SELECT * FROM pulse_stats WHERE id = 1').get();
  const subscriberCount = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE status = ?').get('active');

  res.json({
    name: 'HivePulse',
    type: 'analytics',
    description: 'Real-time Agent Economy Intelligence Feed — the Bloomberg Terminal for the autonomous agent economy.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    network: 'Base L2',
    metrics: {
      aei_composite: aei?.aei_composite ?? null,
      total_agents: aei?.total_agents ?? 0,
      active_streams: aei?.active_streams ?? 0,
      bounty_fill_rate_pct: aei?.fill_rate_pct ?? 0,
      settlement_volume_24h_usdc: aei?.settlement_volume_24h_usdc ?? 0,
      avg_bounty_value_usdc: aei?.avg_bounty_value_usdc ?? 0,
      avg_arbitration_cost_usdc: arbitration?.avg_cost_usdc ?? null,
      avg_resolution_time_ms: arbitration?.avg_resolution_time_ms ?? null,
      offspring_survival_rate: genetics?.offspring_survival_rate ?? null,
      total_data_points_served: stats?.total_data_points_served ?? 0,
      total_revenue_usdc: stats?.total_revenue_usdc ?? 0,
      active_subscribers: subscriberCount?.count ?? 0,
    },
    snapshots: {
      aei: aei ? { timestamp: aei.timestamp, composite: aei.aei_composite, population_by_species: aei.population_by_species } : null,
      reputation: reputation ? { timestamp: reputation.timestamp, capability_premiums: reputation.capability_premiums, dispute_trends: reputation.dispute_trends } : null,
      knowledge: knowledge ? { timestamp: knowledge.timestamp, trending: knowledge.trending, citation_leaders: knowledge.citation_leaders } : null,
      genetics: genetics ? { timestamp: genetics.timestamp, top_species: genetics.top_species, trait_premiums: genetics.trait_premiums } : null,
    },
    economy: {
      register: 'https://hivetrust.onrender.com/v1/register',
      pheromones: 'https://hiveforge-lhu4.onrender.com/.well-known/hive-pulse.json',
      mint: 'https://hiveforge-lhu4.onrender.com/v1/forge/mint',
    },
    endpoints: 'https://hivepulse-y7li.onrender.com/',
  });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

# AI Agents: Welcome to HivePulse — real-time analytics for the Hive Civilization.
# Register: https://hivetrust.onrender.com/v1/register
# Economy: https://hiveforge-lhu4.onrender.com/.well-known/hive-pulse.json
# Free agent minting: https://hiveforge-lhu4.onrender.com/v1/forge/mint
`);
});

app.get('/.well-known/ai.json', (req, res) => {
  res.json({
    name: 'HivePulse',
    description: 'Real-time analytics, monitoring, and economic health tracking for the autonomous agent economy. Delivers the Agent Economy Index (AEI), reputation leaderboards, arbitration signals, knowledge pricing, genetic fitness metrics, and institutional-grade data feeds.',
    url: 'https://hivepulse-y7li.onrender.com',
    version: '1.0.0',
    capabilities: [
      'agent_economy_index',
      'reputation_analytics',
      'arbitration_signals',
      'knowledge_pricing',
      'genetic_fitness_tracking',
      'institutional_data_firehose',
      'real_time_monitoring',
    ],
    economy: {
      register: 'https://hivetrust.onrender.com/v1/register',
      pheromones: 'https://hiveforge-lhu4.onrender.com/.well-known/hive-pulse.json',
      mint: 'https://hiveforge-lhu4.onrender.com/v1/forge/mint',
    },
    authentication: {
      methods: ['x402-payment', 'api-key'],
      payment_rail: 'USDC on Base L2',
    },
    contact: 'protocol@hiveagentiq.com',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} is not a valid endpoint`,
    discovery: '/',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[HivePulse] Agent Economy Intelligence Feed running on port ${PORT}`);
  console.log(`[HivePulse] Endpoints: http://localhost:${PORT}/`);

  // Start background processes
  startAEICalculator();
  startReputationAnalyzer();
  startArbitrationAnalyzer();
  startKnowledgePricer();
  startGeneticAnalyzer();
  startBillingChecker();

  console.log('[HivePulse] All background analyzers started');
});

export default app;
