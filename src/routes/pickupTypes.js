'use strict';

const { Router } = require('express');
const { query } = require('../db/connection');

const router = Router();

// GET /api/pickup-types
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, code, label, description, price_surcharge FROM pickup_delivery_types ORDER BY price_surcharge DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
