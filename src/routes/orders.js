'use strict';

const { Router } = require('express');
const { query } = require('../db/connection');
const matcher = require('../services/driverMatcher');

const router = Router();

// POST /api/orders
router.post('/', async (req, res, next) => {
  const { service_id, pickup_type_id, scheduled_at, notes } = req.body;

  if (!service_id || !pickup_type_id) {
    return res.status(400).json({ error: 'service_id and pickup_type_id are required' });
  }

  try {
    const svc = await query('SELECT id FROM services WHERE id = $1 AND active = TRUE', [service_id]);
    if (!svc.rows.length) return res.status(404).json({ error: 'Service not found' });

    const pt = await query('SELECT id, code FROM pickup_delivery_types WHERE id = $1', [pickup_type_id]);
    if (!pt.rows.length) return res.status(404).json({ error: 'Pickup/delivery type not found' });

    if (pt.rows[0].code === 'scheduled' && !scheduled_at) {
      return res.status(400).json({ error: 'scheduled_at is required for the Scheduled pickup type' });
    }

    const result = await query(
      `INSERT INTO orders (service_id, pickup_type_id, scheduled_at, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, service_id, pickup_type_id, scheduled_at, notes, status, created_at`,
      [service_id, pickup_type_id, scheduled_at || null, notes || null]
    );

    const order = result.rows[0];

    // Start the 5-minute driver-match watch
    matcher.watchOrder(order.id, async (orderId) => {
      try {
        await query(
          'UPDATE orders SET priority_fee_offered = TRUE WHERE id = $1 AND driver_matched_at IS NULL',
          [orderId]
        );
        matcher.pushEvent(orderId, {
          type: 'priority_fee_prompt',
          message: 'Drivers are busy due to rain/traffic. Would you like to add a ₱50 priority fee to get a rider faster?',
          fee_php: matcher.PRIORITY_FEE_PHP,
        });
      } catch (err) {
        console.error('Error offering priority fee for order', orderId, err.message);
      }
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT o.id, s.name AS service, p.label AS pickup_type, p.code AS pickup_type_code,
              o.scheduled_at, o.notes, o.status, o.driver_matched_at,
              o.priority_fee_offered, o.priority_fee_accepted, o.created_at
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN pickup_delivery_types p ON p.id = o.pickup_type_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/priority-fee/accept
// Customer accepts the ₱50 priority fee after the prompt
router.post('/:id/priority-fee/accept', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE orders
       SET priority_fee_accepted = TRUE, status = 'priority_search'
       WHERE id = $1 AND priority_fee_offered = TRUE AND priority_fee_accepted IS NULL
       RETURNING id, status, priority_fee_accepted`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(409).json({ error: 'Order not eligible for priority fee acceptance' });
    }
    res.json({ ...result.rows[0], fee_charged_php: matcher.PRIORITY_FEE_PHP });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/priority-fee/decline
router.post('/:id/priority-fee/decline', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE orders
       SET priority_fee_accepted = FALSE
       WHERE id = $1 AND priority_fee_offered = TRUE AND priority_fee_accepted IS NULL
       RETURNING id, status, priority_fee_accepted`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(409).json({ error: 'Order not eligible for priority fee decision' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/driver-match  (called by driver-side when a driver accepts)
router.patch('/:id/driver-match', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE orders
       SET driver_matched_at = NOW(), status = 'confirmed'
       WHERE id = $1 AND driver_matched_at IS NULL
       RETURNING id, status, driver_matched_at`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found or already matched' });

    matcher.driverMatched(Number(req.params.id));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
