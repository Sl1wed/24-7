# RBX Manager

Dark web dashboard for managing up to 20 Roblox accounts — presence tracking, game join, AFK management, per-account activity logs.

## Setup

```bash
npm install
npm start
# → http://localhost:3000
```

Dev mode (auto-restart):
```bash
npm run dev
```

## Adding Accounts

1. Open Chrome → go to roblox.com → log into the account
2. F12 → Application → Cookies → https://www.roblox.com
3. Find `.ROBLOSECURITY` → copy the value
4. In the dashboard → "Add Account" → paste it

## Features

- Live presence: Offline / Online / In-Game / In Studio
- Per-account avatar, username, display name
- Game name shown when in a game
- Join game by Place ID
- Managed mode — marks accounts as AFK-managed
- Kill / remove any account
- Activity log per account (last 50 events)
- Auto-refresh every 30 seconds
- Stats bar: total / online / in-game / managed

## Notes

- Cookies are stored in `data/accounts.json` — keep this file private
- Join requires the Roblox client to be installed on the target machine — the server sends the join ticket but the actual game launch needs the launcher
- For pure server-side AFK, the presence heartbeat keeps the account appearing online
