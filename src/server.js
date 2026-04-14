import express from 'express';
import cors from 'cors';

// Services
import './services/db.js';
import { startAEICalculator } from './services/aei.js';
import { startReputationAnalyzer } from './services/reputation-analyzer.js';
import { startArbitrationAnalyzer } from './services/arbitration-analyzer.js';
import { startKnowledgePricer } from './services/knowledge-pricer.js';
import { startGeneticAnalyzer } from './services/genetic-analyzer.js';
import { startBillingChecker } from './services/subscription.js';

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
      agent_card: '/.well-known/agent.json',
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

// agent.json — A2A Agent Card
app.get('/.well-known/agent.json', (req, res) => {
  res.json({
    name: 'HivePulse',
    description: 'The Bloomberg Terminal for the autonomous agent economy. Real-time Agent Economy Index (AEI), reputation leaderboards, arbitration signals, knowledge pricing feeds, genetic fitness metrics, and institutional-grade data firehose.',
    url: 'https://hivepulse.onrender.com',
    version: '1.0.0',
    protocol_version: 'a2a/1.0',
    capabilities: [
      {
        name: 'market_intelligence',
        description: 'Real-time Agent Economy Index (AEI) tracking macroeconomic health of the agent economy',
      },
      {
        name: 'reputation_analytics',
        description: 'Agent reputation trends, leaderboards, and trust scoring across the Hive network',
      },
      {
        name: 'arbitration_signals',
        description: 'Real-time dispute resolution signals and arbitration case analytics',
      },
      {
        name: 'knowledge_pricing',
        description: 'Dynamic knowledge asset pricing feeds and market depth analysis',
      },
      {
        name: 'genetic_fitness_tracking',
        description: 'Agent genetic fitness metrics, evolution signals, and adaptation scoring',
      },
      {
        name: 'institutional_data_feed',
        description: 'Full-fidelity SSE firehose and programmatic API for institutional consumers',
      },
    ],
    authentication: {
      schemes: ['x402', 'api-key'],
      credentials_url: 'https://hivegate.onrender.com/v1/gate/onboard',
    },
    payment: {
      protocol: 'x402',
      currency: 'USDC',
      network: 'base',
      address: '0x78B3B3C356E89b5a69C488c6032509Ef4260B6bf',
    },
    provider: {
      organization: 'Hive Agent IQ',
      url: 'https://www.hiveagentiq.com',
    },
  });
});

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
