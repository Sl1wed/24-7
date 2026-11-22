const express = require('express');
const router = express.Router();
const manager = require('../accountManager');

// GET all accounts (no cookies exposed)
router.get('/', (req, res) => {
  res.json({ accounts: manager.getAll() });
});

// POST add account
router.post('/add', async (req, res) => {
  const { cookie } = req.body;
  if (!cookie) return res.status(400).json({ error: 'Cookie required' });
  const result = await manager.addAccount(cookie.trim());
  res.json(result);
});

// DELETE remove account
router.delete('/:id', async (req, res) => {
  const result = await manager.removeAccount(parseInt(req.params.id));
  res.json(result);
});

// GET logs for account
router.get('/:id/logs', (req, res) => {
  const logs = manager.getLogs(parseInt(req.params.id));
  res.json({ logs });
});

// POST set managed (afk in game)
router.post('/:id/manage', (req, res) => {
  const { managed, placeId } = req.body;
  const ok = manager.setManaged(parseInt(req.params.id), managed, placeId);
  res.json({ success: ok });
});

// POST force refresh all
router.post('/refresh', async (req, res) => {
  await manager.refreshAll();
  res.json({ accounts: manager.getAll() });
});

module.exports = router;
