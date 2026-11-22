const express = require('express');
const router = express.Router();
const manager = require('../accountManager');
const roblox = require('../roblox');

// POST join game for an account
router.post('/join', async (req, res) => {
  const { accountId, placeId } = req.body;
  if (!accountId || !placeId) return res.status(400).json({ error: 'accountId and placeId required' });

  const acc = manager.getAccount(parseInt(accountId));
  if (!acc) return res.status(404).json({ error: 'Account not found' });

  const result = await roblox.joinGame(acc.cookie, placeId);
  if (result.success) {
    manager.setManaged(parseInt(accountId), true, placeId);
    manager.addLog(parseInt(accountId), `Join requested for PlaceId: ${placeId}`, 'join');
  } else {
    manager.addLog(parseInt(accountId), `Join failed: ${result.error}`, 'error');
  }
  res.json(result);
});

// POST leave / kill session
router.post('/leave', async (req, res) => {
  const { accountId } = req.body;
  if (!accountId) return res.status(400).json({ error: 'accountId required' });

  const acc = manager.getAccount(parseInt(accountId));
  if (!acc) return res.status(404).json({ error: 'Account not found' });

  manager.setManaged(parseInt(accountId), false);
  manager.addLog(parseInt(accountId), 'Session killed by manager', 'leave');
  res.json({ success: true });
});

module.exports = router;
