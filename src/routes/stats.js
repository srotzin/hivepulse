import { Router } from 'express';
import db from '../services/db.js';
import { getSubscriberCount, getSubscribersByTier } from '../services/subscription.js';
import { getClientCount } from './firehose.js';

const router = Router();

// GET /v1/pulse/stats — platform stats
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare('SELECT * FROM pulse_stats WHERE id = 1').get();
    const snapshotCount = db.prepare('SELECT COUNT(*) as count FROM aei_snapshots').get();
    const firstSnapshot = db.prepare('SELECT timestamp FROM aei_snapshots ORDER BY id ASC LIMIT 1').get();
    const lastSnapshot = db.prepare('SELECT timestamp FROM aei_snapshots ORDER BY id DESC LIMIT 1').get();

    const totalSubscribers = getSubscriberCount();
    const byTier = getSubscribersByTier();

    // Calculate uptime based on snapshot regularity
    let aeiUptimePct = 100;
    if (firstSnapshot && lastSnapshot) {
      const firstTime = new Date(firstSnapshot.timestamp).getTime();
      const lastTime = new Date(lastSnapshot.timestamp).getTime();
      const elapsedMinutes = (lastTime - firstTime) / 60000;
      const expectedSnapshots = Math.max(1, Math.floor(elapsedMinutes));
      aeiUptimePct = Math.min(100, Math.round((snapshotCount.count / expectedSnapshots) * 100));
    }

    res.json({
      service: 'hivepulse',
      endpoint: 'stats',
      total_subscribers: totalSubscribers,
      by_tier: byTier,
      total_data_points_served: stats?.total_data_points_served || 0,
      total_revenue_usdc: stats?.total_revenue_usdc || 0,
      aei_snapshots: snapshotCount.count,
      aei_uptime_pct: aeiUptimePct,
      firehose_clients: getClientCount(),
      last_updated: stats?.last_updated || new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
});

export default router;
