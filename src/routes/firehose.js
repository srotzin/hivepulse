import { Router } from 'express';
import { x402Middleware } from '../middleware/auth.js';
import { subscriptionGate } from '../middleware/subscription-gate.js';

const router = Router();

// Connected SSE clients
const clients = new Set();

// GET /v1/pulse/firehose — SSE stream (institutional only)
router.get('/firehose', x402Middleware, subscriptionGate('firehose'), (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Filter options
  const filters = {
    event_type: req.query.event_type ? req.query.event_type.split(',') : null,
    did: req.query.did || null,
    species: req.query.species || null,
    jurisdiction: req.query.jurisdiction || null,
  };

  const client = { res, filters };
  clients.add(client);

  // Send heartbeat every 30s
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
});

// Broadcast event to all connected SSE clients
export function broadcastEvent(event) {
  const data = JSON.stringify(event);

  for (const client of clients) {
    try {
      // Apply filters
      if (client.filters.event_type && !client.filters.event_type.includes(event.type)) continue;
      if (client.filters.did && event.did !== client.filters.did) continue;
      if (client.filters.species && event.species !== client.filters.species) continue;
      if (client.filters.jurisdiction && event.jurisdiction !== client.filters.jurisdiction) continue;

      client.res.write(`event: ${event.type}\ndata: ${data}\n\n`);
    } catch {
      clients.delete(client);
    }
  }
}

export function getClientCount() {
  return clients.size;
}

export default router;
