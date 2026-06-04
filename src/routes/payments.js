'use strict';

const { Router } = require('express');
const { query } = require('../db/connection');
const matcher = require('../services/driverMatcher');

const router = Router();

const ONLINE_METHODS = new Set(['gcash', 'maya', 'card', 'bank_transfer']);

// POST /api/orders/:id/pay
// Body: { method: 'gcash' | 'maya' | 'card' | 'bank_transfer' | 'cash' }
// When method is an online method, marks the order as prepaid and pushes a
// 'prepaid_delivery' event to the rider dispatch stream.
router.post('/:id/pay', async (req, res, next) => {
  const { method } = req.body;

  if (!method) return res.status(400).json({ error: 'payment method is required' });

  const normalised = method.toLowerCase().trim();
  if (!ONLINE_METHODS.has(normalised) && normalised !== 'cash') {
    return res.status(400).json({
      error: `Unsupported payment method. Accepted: cash, ${[...ONLINE_METHODS].join(', ')}`,
    });
  }

  try {
    const isOnline = ONLINE_METHODS.has(normalised);
    const newPaymentStatus = isOnline ? 'paid' : 'cash_on_delivery';
    const newOrderStatus   = isOnline ? 'prepaid' : 'pending';

    const result = await query(
      `UPDATE orders
       SET payment_method = $1,
           payment_status = $2,
           paid_at        = $3,
           status         = $4
       WHERE id = $5 AND payment_status = 'unpaid'
       RETURNING id, status, payment_method, payment_status, paid_at`,
      [normalised, newPaymentStatus, isOnline ? new Date() : null, newOrderStatus, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(409).json({ error: 'Order not found or already paid' });
    }

    const order = result.rows[0];

    if (isOnline) {
      // Push a prepaid delivery request through the SSE stream so the rider
      // dispatch layer knows this is a prepaid order and can prioritise accordingly.
      matcher.pushEvent(Number(req.params.id), {
        type:    'prepaid_delivery_request',
        message: 'Customer has paid online. This is a Prepaid delivery request.',
        payment_method: normalised,
        order_id: order.id,
      });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
