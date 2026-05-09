'use strict';

const listeners = new Map();

function _formatData(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function subscribe(userId, req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write('retry: 10000\n\n');

  const id = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  listeners.set(id, { userId, res });

  req.on('close', () => {
    listeners.delete(id);
  });

  return id;
}

function publish(userId, payload) {
  const event = _formatData(payload);
  for (const [id, listener] of listeners.entries()) {
    if (listener.userId === userId) {
      listener.res.write(event);
    }
  }
}

module.exports = { subscribe, publish };
