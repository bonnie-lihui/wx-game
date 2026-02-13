/**
 * 用户相关业务：初始化、保存进度、解锁、分享
 * @file server-node/controller/userController.js
 */

const userModel = require('../model/userModel');

/**
 * POST /api/user/init - 初始化用户
 * 入参：openid, nickname
 * 出参：userInfo, unlockList
 */
async function init(req, res) {
  const { openid, nickname } = req.body || {};
  if (!openid) {
    return res.status(400).json({ code: 400, msg: '缺少 openid' });
  }
  try {
    const user = await userModel.findOrCreate(openid, nickname);
    res.json({
      userInfo: { openid: user.openid, nickname: user.nickname, avatar: user.avatar },
      unlockList: {
        games: user.unlock_game || [],
        themes: user.unlock_theme || [],
        hidden: !!user.hidden_unlock,
      },
    });
  } catch (e) {
    console.error('[userController.init]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

/**
 * POST /api/user/saveProgress
 * 入参：openid, gameId, level, score?
 */
async function saveProgress(req, res) {
  const { openid, gameId, level, score } = req.body || {};
  if (!openid || !gameId) {
    return res.status(400).json({ code: 400, msg: '缺少 openid 或 gameId' });
  }
  try {
    await userModel.saveProgress(openid, gameId, level || 1, score);
    res.json({ success: true, msg: 'ok' });
  } catch (e) {
    console.error('[userController.saveProgress]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

/**
 * POST /api/user/unlockGame
 * 入参：openid, gameId, type (game|theme)
 */
async function unlockGame(req, res) {
  const { openid, gameId, type } = req.body || {};
  if (!openid || !gameId) {
    return res.status(400).json({ code: 400, msg: '缺少 openid 或 gameId' });
  }
  try {
    const result = await userModel.unlockGame(openid, gameId, type || 'game');
    res.json({ unlockStatus: true, unlockList: result, msg: 'ok' });
  } catch (e) {
    console.error('[userController.unlockGame]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

/**
 * POST /api/user/unlockHidden
 */
async function unlockHidden(req, res) {
  const { openid } = req.body || {};
  if (!openid) return res.status(400).json({ code: 400, msg: '缺少 openid' });
  try {
    const result = await userModel.unlockHidden(openid);
    res.json({ hidden: true, ...result, msg: 'ok' });
  } catch (e) {
    console.error('[userController.unlockHidden]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

/**
 * POST /api/user/shareSuccess
 */
async function shareSuccess(req, res) {
  const { openid, gameId } = req.body || {};
  if (!openid) return res.status(400).json({ code: 400, msg: '缺少 openid' });
  try {
    await userModel.shareSuccess(openid, gameId || '');
    res.json({ success: true, msg: 'ok' });
  } catch (e) {
    console.error('[userController.shareSuccess]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

module.exports = {
  init,
  saveProgress,
  unlockGame,
  unlockHidden,
  shareSuccess,
};
