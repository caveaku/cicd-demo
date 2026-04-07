const express = require('express');
const app = express();

app.use(express.json());

// Health check endpoint — used by Docker & K8s probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: process.env.APP_VERSION || '1.0.0' });
});

// Main API
app.get('/api/greet', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!`, timestamp: new Date().toISOString() });
});

app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
});

module.exports = app;
