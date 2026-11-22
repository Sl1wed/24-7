const express = require('express');
const cors = require('cors');
const path = require('path');
const accountRoutes = require('./routes/accounts');
const gameRoutes = require('./routes/games');
const accountManager = require('./accountManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/accounts', accountRoutes);
app.use('/api/games', gameRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

accountManager.startHeartbeats();

app.listen(PORT, () => {
  console.log(`\n🟢 Roblox Manager running → http://localhost:${PORT}\n`);
});
