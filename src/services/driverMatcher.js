'use strict';

const MATCH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const PRIORITY_FEE_PHP = 50;

// orderId -> NodeJS.Timeout
const pendingTimers = new Map();

// orderId -> Express Response (SSE connection)
const sseClients = new Map();

function watchOrder(orderId, onNoMatch) {
  const timer = setTimeout(() => {
    pendingTimers.delete(orderId);
    onNoMatch(orderId);
  }, MATCH_TIMEOUT_MS);
  pendingTimers.set(orderId, timer);
}

// Call when a driver is matched — cancels the no-match timer
function driverMatched(orderId) {
  const timer = pendingTimers.get(orderId);
  if (timer) {
    clearTimeout(timer);
    pendingTimers.delete(orderId);
  }
  pushEvent(orderId, { type: 'driver_matched' });
}

function registerSSEClient(orderId, res) {
  sseClients.set(orderId, res);
}

function removeSSEClient(orderId) {
  sseClients.delete(orderId);
}

function pushEvent(orderId, payload) {
  const client = sseClients.get(orderId);
  if (client && !client.writableEnded) {
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

module.exports = {
  PRIORITY_FEE_PHP,
  watchOrder,
  driverMatched,
  registerSSEClient,
  removeSSEClient,
  pushEvent,
};
