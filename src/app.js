'use strict';

require('dotenv').config();
const express = require('express');

const servicesRouter   = require('./routes/services');
const pickupTypesRouter = require('./routes/pickupTypes');
const ordersRouter     = require('./routes/orders');

const app = express();
app.use(express.json());

app.use('/api/services',      servicesRouter);
app.use('/api/pickup-types',  pickupTypesRouter);
app.use('/api/orders',        ordersRouter);

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CYRAH API listening on port ${PORT}`));

module.exports = app;
