'use strict';

const { Router } = require('express');
const { query } = require('../db/connection');
const matcher = require('../services/driverMatcher');

const router = Router();

// GET /api/orders/:id/events
// Server-Sent Events stream — customer listens here after placing an order.
// The server pushes a 'priority_fee_prompt' event if no driver matches in 5 minutes,
// and a 'driver_matched' event when a driver accepts.
router.get('/:id/events', async (req, res, next) => {
  try {
    const result = await query('SELECT id FROM orders WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });

    res.set({
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const orderId = Number(req.params.id);
    matcher.registerSSEClient(orderId, res);

    // Heartbeat every 30 s to keep the connection alive through proxies
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(': ping\n\n');
    }, 30_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      matcher.removeSSEClient(orderId);
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
