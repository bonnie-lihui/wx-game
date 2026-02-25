/**
 * 用户相关业务：初始化、保存进度、解锁、分享
 * @file server-node/controller/userController.js
 */

const userModel = require('../model/userModel');
const axios = require('axios');
const config = require('../config');

// 用于防止 code 重复使用的缓存（内存级别）
const usedCodes = new Map(); // key: code, value: timestamp
const CODE_EXPIRE_TIME = 5 * 60 * 1000; // 5 分钟过期

// 定期清理过期的 code（每分钟清理一次）
setInterval(() => {
  const now = Date.now();
  for (const [code, timestamp] of usedCodes.entries()) {
    if (now - timestamp > CODE_EXPIRE_TIME) {
      usedCodes.delete(code);
    }
  }
}, 60 * 1000);

/**
 * POST /api/user/wxLogin - 微信无感登录
 * 入参：code, nickname?, avatarUrl?
 * 出参：userInfo, unlockList
 */
async function wxLogin(req, res) {
  const { code, nickname, avatarUrl } = req.body || {};
  
  if (!code) {
    return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
  }

  // 检查 code 是否已经被使用（本地缓存检查）
  if (usedCodes.has(code)) {
    console.log('[userController.wxLogin] code 已在本地缓存中，拒绝重复请求', { code: code.substring(0, 10) + '...' });
    return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
  }

  // 标记 code 为正在使用（立即标记，防止并发）
  usedCodes.set(code, Date.now());
  console.log('[userController.wxLogin] 开始处理登录请求', { 
    code: code.substring(0, 10) + '...',
    usedCodesCount: usedCodes.size,
    timestamp: Date.now()
  });
  
  try {
    // 调用微信 API 获取 openid 和 session_key
    const wxApiUrl = 'https://api.weixin.qq.com/sns/jscode2session';
    const startTime = Date.now();
    const wxRes = await axios.get(wxApiUrl, {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        js_code: code,
        grant_type: 'authorization_code',
      },
      timeout: 10000,
    });
    
    const apiDuration = Date.now() - startTime;
    console.log(`[userController.wxLogin] 微信API响应，耗时 ${apiDuration}ms`);
    
    const { openid, session_key, errcode, errmsg } = wxRes.data || {};
    
    // 处理微信 API 返回的错误
    if (errcode) {
      console.error('[userController.wxLogin] 微信API错误', { 
        errcode, 
        errmsg,
        apiDuration,
        code: code.substring(0, 10) + '...'
      });
      
      // 40029: code 已被使用或无效
      if (errcode === 40029) {
        // 这个 code 确实无效，保留在缓存中
        return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
      }
      
      // 其他错误，移除缓存允许重试；对前端只返回通用文案
      usedCodes.delete(code);
      return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
    }
    
    if (!openid || !session_key) {
      console.error('[userController.wxLogin] 微信API返回数据异常', wxRes.data);
      usedCodes.delete(code);
      return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
    }
    
    // 保存或更新用户信息
    const user = await userModel.wxLogin(openid, session_key, nickname, avatarUrl);
    
    console.log('[userController.wxLogin] 登录成功', { 
      openid: openid.substring(0, 10) + '...',
      nickname: user.nickname || '(空)' 
    });

    res.json({
      success: true,
      userInfo: { 
        openid: user.openid, 
        nickname: user.nickname, 
        avatar: user.avatar 
      },
      unlockList: {
        games: user.unlock_game || [],
        themes: user.unlock_theme || [],
        hidden: !!user.hidden_unlock,
      },
    });
  } catch (e) {
    usedCodes.delete(code);
    // 正式环境排查：打印完整错误信息（含堆栈），便于区分是微信 API、数据库还是 SESSION_KEY_ENCRYPTION_KEY 等问题
    console.error('[userController.wxLogin] 异常', e && e.message ? e.message : e);
    if (e && e.stack) console.error('[userController.wxLogin] 堆栈', e.stack);
    return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
  }
}

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
  wxLogin,
  init,
  saveProgress,
  unlockGame,
  unlockHidden,
  shareSuccess,
};
