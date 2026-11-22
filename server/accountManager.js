const fse = require('fs-extra');
const path = require('path');
const { getUserInfo, getPresence, getAvatar } = require('./roblox');

const DATA_FILE = path.join(__dirname, '../data/accounts.json');
const LOG_FILE = path.join(__dirname, '../data/logs.json');

// In-memory state
let accounts = [];
let logs = {};

async function load() {
  await fse.ensureDir(path.join(__dirname, '../data'));
  if (await fse.pathExists(DATA_FILE)) {
    accounts = await fse.readJson(DATA_FILE);
  }
  if (await fse.pathExists(LOG_FILE)) {
    logs = await fse.readJson(LOG_FILE);
  }
  // Init logs for any account missing them
  for (const acc of accounts) {
    if (!logs[acc.id]) logs[acc.id] = [];
  }
}

async function save() {
  await fse.writeJson(DATA_FILE, accounts, { spaces: 2 });
  await fse.writeJson(LOG_FILE, logs, { spaces: 2 });
}

function addLog(accountId, message, type = 'info') {
  if (!logs[accountId]) logs[accountId] = [];
  logs[accountId].unshift({
    time: new Date().toISOString(),
    message,
    type, // info | warn | error | join | leave
  });
  // Keep last 50 logs per account
  if (logs[accountId].length > 50) logs[accountId] = logs[accountId].slice(0, 50);
}

async function addAccount(cookie) {
  const info = await getUserInfo(cookie);
  if (!info) return { success: false, error: 'Invalid cookie or account banned' };

  const existing = accounts.find(a => a.id === info.id);
  if (existing) return { success: false, error: 'Account already added' };

  if (accounts.length >= 20) return { success: false, error: 'Max 20 accounts reached' };

  const avatar = await getAvatar(info.id);

  const account = {
    id: info.id,
    username: info.name,
    displayName: info.displayName,
    cookie,
    avatar,
    status: 0,
    gameName: null,
    gameId: null,
    addedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    online: false,
    managed: false, // whether we're actively keeping it in a game
    targetPlaceId: null,
  };

  accounts.push(account);
  logs[info.id] = [];
  addLog(info.id, `Account added: ${info.name}`, 'info');
  await save();
  return { success: true, account };
}

async function removeAccount(accountId) {
  const idx = accounts.findIndex(a => a.id === accountId);
  if (idx === -1) return { success: false, error: 'Not found' };
  const name = accounts[idx].username;
  accounts.splice(idx, 1);
  delete logs[accountId];
  await save();
  return { success: true, message: `Removed ${name}` };
}

async function refreshAccount(acc) {
  try {
    const presence = await getPresence(acc.cookie, acc.id);
    acc.status = presence.status;
    acc.gameName = presence.gameName;
    acc.gameId = presence.gameId;
    acc.online = presence.status > 0;
    acc.lastSeen = new Date().toISOString();

    const statusMap = { 0: 'Offline', 1: 'Online', 2: 'In-Game', 3: 'In Studio' };
    addLog(acc.id, `Status: ${statusMap[presence.status] || 'Unknown'}${presence.gameName ? ' — ' + presence.gameName : ''}`, 'info');
  } catch {
    addLog(acc.id, 'Presence check failed', 'warn');
  }
}

async function refreshAll() {
  await Promise.all(accounts.map(refreshAccount));
  await save();
}

function getAll() {
  return accounts.map(a => ({
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    avatar: a.avatar,
    status: a.status,
    gameName: a.gameName,
    gameId: a.gameId,
    online: a.online,
    managed: a.managed,
    targetPlaceId: a.targetPlaceId,
    addedAt: a.addedAt,
    lastSeen: a.lastSeen,
  }));
}

function getAccount(id) {
  return accounts.find(a => a.id === id);
}

function getLogs(accountId) {
  return logs[accountId] || [];
}

function setManaged(accountId, managed, placeId = null) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return false;
  acc.managed = managed;
  acc.targetPlaceId = placeId;
  addLog(accountId, managed ? `Set to managed — PlaceId: ${placeId}` : 'Removed from managed', managed ? 'join' : 'leave');
  save();
  return true;
}

function startHeartbeats() {
  load().then(() => {
    console.log(`[Manager] Loaded ${accounts.length} accounts`);
    // Refresh every 30s
    setInterval(async () => {
      if (accounts.length > 0) {
        await refreshAll();
        console.log(`[Manager] Refreshed ${accounts.length} accounts`);
      }
    }, 30000);

    // Initial refresh
    if (accounts.length > 0) refreshAll();
  });
}

module.exports = {
  startHeartbeats,
  addAccount,
  removeAccount,
  getAll,
  getAccount,
  getLogs,
  setManaged,
  refreshAll,
  addLog,
};
