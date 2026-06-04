'use strict';

const { Router } = require('express');
const { query } = require('../db/connection');

const router = Router();

// GET /api/services
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, description, base_price FROM services WHERE active = TRUE ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, description, base_price FROM services WHERE id = $1 AND active = TRUE',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
