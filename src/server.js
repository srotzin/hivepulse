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
    service: 'hivepulse',
    description: 'The Bloomberg Terminal for the autonomous agent economy',
    version: '1.0.0',
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
    subscription_tiers: {
      free: { price: '$0', access: 'AEI with 5-min delay' },
      builder: { price: '$99/mo', access: 'Real-time AEI + reputation' },
      professional: { price: '$499/mo', access: 'All signals + arbitration + knowledge + genetics' },
      institutional: { price: '$5,000/mo', access: 'Full firehose + API access + all signals' },
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
