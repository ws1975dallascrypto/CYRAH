'use strict';

const { Router } = require('express');
const { query } = require('../db/connection');

const router = Router();

// POST /api/orders
// Body: { service_id, pickup_type_id, scheduled_at?, notes? }
router.post('/', async (req, res, next) => {
  const { service_id, pickup_type_id, scheduled_at, notes } = req.body;

  if (!service_id || !pickup_type_id) {
    return res.status(400).json({ error: 'service_id and pickup_type_id are required' });
  }

  try {
    // Verify service exists
    const svc = await query('SELECT id FROM services WHERE id = $1 AND active = TRUE', [service_id]);
    if (!svc.rows.length) return res.status(404).json({ error: 'Service not found' });

    // Verify pickup type exists and enforce scheduled_at for 'scheduled'
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

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT o.id, s.name AS service, p.label AS pickup_type, p.code AS pickup_type_code,
              o.scheduled_at, o.notes, o.status, o.created_at
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

module.exports = router;
