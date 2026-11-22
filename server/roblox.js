const axios = require('axios');

function client(cookie) {
  return axios.create({
    headers: {
      Cookie: `.ROBLOSECURITY=${cookie}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });
}

async function getAuthToken(cookie) {
  try {
    await client(cookie).post('https://auth.roblox.com/v2/logout').catch(() => {});
    const res = await client(cookie).post('https://auth.roblox.com/v2/logout');
    return res.headers['x-csrf-token'] || null;
  } catch (err) {
    if (err.response && err.response.headers['x-csrf-token']) {
      return err.response.headers['x-csrf-token'];
    }
    return null;
  }
}

async function getUserInfo(cookie) {
  try {
    const res = await client(cookie).get('https://users.roblox.com/v1/users/authenticated');
    return { id: res.data.id, name: res.data.name, displayName: res.data.displayName };
  } catch {
    return null;
  }
}

async function getPresence(cookie, userId) {
  try {
    const csrf = await getAuthToken(cookie);
    const res = await client(cookie).post(
      'https://presence.roblox.com/v1/presence/users',
      { userIds: [userId] },
      { headers: { 'x-csrf-token': csrf } }
    );
    const p = res.data.userPresences[0];
    return {
      status: p.userPresenceType, // 0=offline,1=online,2=in-game,3=in-studio
      gameId: p.placeId || null,
      gameName: p.lastLocation || null,
      universeId: p.universeId || null,
    };
  } catch {
    return { status: 0, gameId: null, gameName: null };
  }
}

async function getAvatar(userId) {
  try {
    const res = await axios.get(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`
    );
    return res.data.data[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

async function joinGame(cookie, placeId) {
  // Roblox requires the launcher deep link; we can trigger via the join API
  // This sets the account's status to "wants to join" — works for server-side presence tracking
  // Full in-client join requires the Roblox client binary (not possible pure web)
  // What we CAN do: generate the join link and track the request
  try {
    const csrf = await getAuthToken(cookie);
    const userInfo = await getUserInfo(cookie);
    if (!userInfo) return { success: false, error: 'Auth failed' };

    // Fetch a join ticket
    const res = await client(cookie).post(
      `https://gamejoin.roblox.com/v1/join-game`,
      {
        placeId: parseInt(placeId),
        isTeleport: false,
        gameId: '',
        gameJoinAttemptId: require('uuid').v4(),
      },
      { headers: { 'x-csrf-token': csrf } }
    );

    return { success: true, ticket: res.data.joinScript || null };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
}

async function leaveGame(cookie) {
  // No official leave endpoint; presence expires naturally
  // We mark the account as left in our manager
  return { success: true };
}

module.exports = { getUserInfo, getPresence, getAvatar, joinGame, leaveGame, getAuthToken };
