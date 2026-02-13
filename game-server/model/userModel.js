/**
 * 用户表操作：进度、解锁状态 CRUD
 * 说明：移除了未使用的分享记录功能
 * @file server/model/userModel.js
 */

const pool = require('./pool');

/**
 * 初始化/获取用户
 * @param {string} openid
 * @param {string} [nickname]
 * @returns {Promise<Object>}
 */
async function findOrCreate(openid, nickname) {
  const [rows] = await pool.query(
    'SELECT id, openid, nickname, avatar, unlock_game, unlock_theme, max_score, hidden_unlock FROM t_user WHERE openid = ?',
    [openid]
  );
  if (rows && rows.length > 0) {
    const u = rows[0];
    if (nickname && u.nickname !== nickname) {
      await pool.query('UPDATE t_user SET nickname = ?, update_time = NOW() WHERE openid = ?', [nickname, openid]);
      u.nickname = nickname;
    }
    return normalizeUser(u);
  }
  await pool.query(
    'INSERT INTO t_user (openid, nickname, unlock_game, unlock_theme, max_score) VALUES (?, ?, ?, ?, ?)',
    [openid, nickname || '', '[]', '[]', '{}']
  );
  return findOrCreate(openid, nickname);
}

function normalizeUser(row) {
  if (!row) return null;
  let unlock_game = [];
  let unlock_theme = [];
  let max_score = {};
  try {
    if (row.unlock_game) unlock_game = JSON.parse(row.unlock_game);
  } catch (e) {}
  try {
    if (row.unlock_theme) unlock_theme = JSON.parse(row.unlock_theme);
  } catch (e) {}
  try {
    if (row.max_score) max_score = JSON.parse(row.max_score);
  } catch (e) {}
  return {
    id: row.id,
    openid: row.openid,
    nickname: row.nickname,
    avatar: row.avatar,
    unlock_game,
    unlock_theme,
    max_score,
    hidden_unlock: row.hidden_unlock === 1,
  };
}

/**
 * 保存进度
 * @param {string} openid
 * @param {string} gameId
 * @param {number} level
 * @param {number} [score]
 */
async function saveProgress(openid, gameId, level, score) {
  const user = await findOrCreate(openid);
  const max_score = user.max_score || {};
  const key = gameId;
  const prev = max_score[key];
  if (score != null && (prev == null || score > prev)) {
    max_score[key] = score;
  }
  await pool.query(
    'UPDATE t_user SET unlock_game = ?, max_score = ?, update_time = NOW() WHERE openid = ?',
    [JSON.stringify(user.unlock_game), JSON.stringify(max_score), openid]
  );
  await pool.query(
    'INSERT INTO t_user_progress (openid, game_id, level, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE level = ?, score = ?',
    [openid, gameId, level, score || 0, level, score || 0]
  );
}

/**
 * 解锁玩法
 * @param {string} openid
 * @param {string} gameId
 * @param {string} type - game | theme
 */
async function unlockGame(openid, gameId, type) {
  const user = await findOrCreate(openid);
  if (type === 'theme') {
    if (!user.unlock_theme.includes(gameId)) user.unlock_theme.push(gameId);
  } else {
    if (!user.unlock_game.includes(gameId)) user.unlock_game.push(gameId);
  }
  await pool.query(
    'UPDATE t_user SET unlock_game = ?, unlock_theme = ?, update_time = NOW() WHERE openid = ?',
    [JSON.stringify(user.unlock_game), JSON.stringify(user.unlock_theme), openid]
  );
  return { unlock_game: user.unlock_game, unlock_theme: user.unlock_theme };
}

/**
 * 解锁隐藏玩法
 * @param {string} openid
 */
async function unlockHidden(openid) {
  const [rows] = await pool.query('SELECT hidden_unlock FROM t_user WHERE openid = ?', [openid]);
  const hidden = rows && rows[0] && rows[0].hidden_unlock === 1;
  if (!hidden) {
    await pool.query('UPDATE t_user SET hidden_unlock = 1, update_time = NOW() WHERE openid = ?', [openid]);
  }
  return { hidden: true };
}

module.exports = {
  findOrCreate,
  saveProgress,
  unlockGame,
  unlockHidden,
};

