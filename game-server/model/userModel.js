/**
 * 用户表操作
 * session_key 落库前经 AES-256-GCM 加密
 * @file server/model/userModel.js
 */

const pool = require('./pool');
const { encryptSessionKey } = require('../utils/sessionKeyCrypto');

const VALID_PLATFORMS = ['wx', 'tiktok', 'others'];

/**
 * 初始化/获取用户
 * @param {string} openid
 * @param {string} [nickname]
 * @param {string} [sessionKey]
 * @param {string} [platform] - wx | tiktok | others
 * @returns {Promise<Object>}
 */
async function findOrCreate(openid, nickname, sessionKey, platform) {
  const [rows] = await pool.query(
    'SELECT id, openid, nickname, avatar, platform FROM t_user WHERE openid = ?',
    [openid]
  );
  if (rows && rows.length > 0) {
    const u = rows[0];
    const updates = [];
    const params = [];

    if (nickname && u.nickname !== nickname) {
      updates.push('nickname = ?');
      params.push(nickname);
    }
    if (sessionKey) {
      updates.push('session_key = ?');
      params.push(encryptSessionKey(sessionKey));
    }
    if (platform && VALID_PLATFORMS.includes(platform) && u.platform !== platform) {
      updates.push('platform = ?');
      params.push(platform);
    }

    if (updates.length > 0) {
      updates.push('update_time = NOW()');
      params.push(openid);
      await pool.query(`UPDATE t_user SET ${updates.join(', ')} WHERE openid = ?`, params);
      if (nickname) u.nickname = nickname;
      if (platform && VALID_PLATFORMS.includes(platform)) u.platform = platform;
    }

    return normalizeUser(u);
  }

  const storedSessionKey = sessionKey ? encryptSessionKey(sessionKey) : null;
  const safePlatform = VALID_PLATFORMS.includes(platform) ? platform : 'wx';
  await pool.query(
    'INSERT INTO t_user (openid, nickname, session_key, platform) VALUES (?, ?, ?, ?)',
    [openid, nickname || '', storedSessionKey, safePlatform]
  );
  return findOrCreate(openid, nickname, sessionKey, platform);
}

function normalizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    openid: row.openid,
    nickname: row.nickname,
    avatar: row.avatar,
    platform: row.platform || 'wx',
  };
}

/**
 * 保存进度（写入 t_user_progress 表）
 * @param {string} openid
 * @param {string} gameId
 * @param {number} level
 * @param {number} [score]
 */
async function saveProgress(openid, gameId, level, score) {
  await pool.query(
    'UPDATE t_user SET update_time = NOW() WHERE openid = ?',
    [openid]
  );
  await pool.query(
    'INSERT INTO t_user_progress (openid, game_id, level, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE level = ?, score = ?',
    [openid, gameId, level, score || 0, level, score || 0]
  );
}

/**
 * 微信登录 - 保存用户信息和 session_key
 * @param {string} openid
 * @param {string} sessionKey
 * @param {string} [nickname]
 * @param {string} [avatar]
 * @param {string} [platform] - wx | tiktok | others
 * @returns {Promise<Object>}
 */
async function wxLogin(openid, sessionKey, nickname, avatar, platform) {
  const user = await findOrCreate(openid, nickname, sessionKey, platform);

  if (avatar && user.avatar !== avatar) {
    await pool.query('UPDATE t_user SET avatar = ?, update_time = NOW() WHERE openid = ?', [avatar, openid]);
    user.avatar = avatar;
  }

  return user;
}

module.exports = {
  findOrCreate,
  saveProgress,
  wxLogin,
};

