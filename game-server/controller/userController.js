/**
 * 用户相关业务：登录、初始化、保存进度
 * @file server-node/controller/userController.js
 */

const userModel = require('../model/userModel');
const axios = require('axios');
const config = require('../config');

const usedCodes = new Map();
const CODE_EXPIRE_TIME = 5 * 60 * 1000;

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
 * 入参：code, nickname?, avatarUrl?, platform?
 * 出参：userInfo
 */
async function wxLogin(req, res) {
  const { code, nickname, avatarUrl, platform } = req.body || {};

  if (!code) {
    return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
  }

  if (usedCodes.has(code)) {
    console.log('[userController.wxLogin] code 已在本地缓存中，拒绝重复请求', { code: code.substring(0, 10) + '...' });
    return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
  }

  usedCodes.set(code, Date.now());
  console.log('[userController.wxLogin] 开始处理登录请求', {
    code: code.substring(0, 10) + '...',
    platform: platform || 'wx',
    usedCodesCount: usedCodes.size,
    timestamp: Date.now()
  });

  try {
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

    if (errcode) {
      console.error('[userController.wxLogin] 微信API错误', {
        errcode,
        errmsg,
        apiDuration,
        code: code.substring(0, 10) + '...'
      });

      if (errcode === 40029) {
        return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
      }

      usedCodes.delete(code);
      return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
    }

    if (!openid || !session_key) {
      console.error('[userController.wxLogin] 微信API返回数据异常', wxRes.data);
      usedCodes.delete(code);
      return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
    }

    const user = await userModel.wxLogin(openid, session_key, nickname, avatarUrl, platform || 'wx');

    console.log('[userController.wxLogin] 登录成功', {
      openid: openid.substring(0, 10) + '...',
      nickname: user.nickname || '(空)',
      platform: user.platform
    });

    res.json({
      success: true,
      userInfo: {
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        platform: user.platform,
      },
    });
  } catch (e) {
    usedCodes.delete(code);
    console.error('[userController.wxLogin] 异常', e && e.message ? e.message : e);
    if (e && e.stack) console.error('[userController.wxLogin] 堆栈', e.stack);
    return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
  }
}

/**
 * POST /api/user/tiktokLogin - 抖音小程序无感登录
 * 入参：code, anonymousCode?, nickname?, avatarUrl?
 * 出参：userInfo
 */
async function tiktokLogin(req, res) {
  const { code, anonymousCode, nickname, avatarUrl } = req.body || {};

  if (!code && !anonymousCode) {
    console.log('[userController.tiktokLogin] 参数缺失，code 和 anonymousCode 均为空', {
      body: JSON.stringify(req.body || {}),
      timestamp: Date.now()
    });
    return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
  }

  const cacheKey = 'tt:' + (code || anonymousCode);
  if (usedCodes.has(cacheKey)) {
    console.log('[userController.tiktokLogin] code 已在本地缓存中，拒绝重复请求', {
      cacheKey: cacheKey.substring(0, 15) + '...',
      cachedAt: usedCodes.get(cacheKey),
      now: Date.now()
    });
    return res.status(400).json({ code: 400, msg: '登录失败，请重试' });
  }

  usedCodes.set(cacheKey, Date.now());
  console.log('[userController.tiktokLogin] 开始处理登录请求', {
    hasCode: !!code,
    hasAnonymousCode: !!anonymousCode,
    usedCodesCount: usedCodes.size,
    timestamp: Date.now()
  });

  try {
    const ttApiUrl = 'https://minigame.zijieapi.com/mgplatform/api/apps/jscode2session';
    const startTime = Date.now();
    const params = {
      appid: config.tiktok.appId,
      secret: config.tiktok.appSecret,
    };
    if (code) params.code = code;
    if (anonymousCode) params.anonymous_code = anonymousCode;

    const secretMask = config.tiktok.appSecret
      ? config.tiktok.appSecret.substring(0, 6) + '***' + config.tiktok.appSecret.slice(-4)
      : '(empty)';
    console.log('[userController.tiktokLogin] 请求抖音小游戏API', {
      url: ttApiUrl,
      appid: config.tiktok.appId,
      secretMask,
      hasCode: !!code,
      codeLen: code ? code.length : 0,
      hasAnonymousCode: !!anonymousCode,
    });

    const ttRes = await axios.get(ttApiUrl, { params, timeout: 10000 });

    const apiDuration = Date.now() - startTime;
    const ttData = ttRes.data || {};
    console.log(`[userController.tiktokLogin] 抖音API响应，耗时 ${apiDuration}ms`, {
      error: ttData.error,
      errcode: ttData.errcode,
      hasOpenid: !!ttData.openid,
      httpStatus: ttRes.status,
    });

    if (ttData.error !== 0) {
      console.error('[userController.tiktokLogin] 抖音API错误', {
        error: ttData.error,
        errcode: ttData.errcode,
        errmsg: ttData.errmsg || ttData.message,
        apiDuration,
      });
      usedCodes.delete(cacheKey);
      return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
    }

    const { openid, anonymous_openid, session_key } = ttData;
    const finalOpenid = openid || anonymous_openid;

    if (!finalOpenid) {
      console.error('[userController.tiktokLogin] 抖音API返回数据异常', ttData);
      usedCodes.delete(cacheKey);
      return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
    }

    console.log('[userController.tiktokLogin] 开始写入/查询用户数据', {
      finalOpenid: finalOpenid.substring(0, 10) + '...',
      isAnonymous: !openid,
    });
    const dbStartTime = Date.now();
    const user = await userModel.wxLogin(finalOpenid, session_key || '', nickname, avatarUrl, 'tiktok');
    console.log(`[userController.tiktokLogin] 用户数据操作完成，耗时 ${Date.now() - dbStartTime}ms`);

    console.log('[userController.tiktokLogin] 登录成功', {
      openid: finalOpenid.substring(0, 10) + '...',
      nickname: user.nickname || '(空)',
      isAnonymous: !openid,
    });

    res.json({
      success: true,
      userInfo: {
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        platform: user.platform,
      },
    });
  } catch (e) {
    usedCodes.delete(cacheKey);
    console.error('[userController.tiktokLogin] 异常', {
      message: e && e.message,
      code: e && e.code,
      status: e && e.response && e.response.status,
      responseData: e && e.response && e.response.data,
    });
    if (e && e.stack) console.error('[userController.tiktokLogin] 堆栈', e.stack);
    return res.status(500).json({ code: 500, msg: '登录失败，请重试' });
  }
}

/**
 * POST /api/user/init - 初始化用户
 * 入参：openid, nickname?, platform?
 * 出参：userInfo
 */
async function init(req, res) {
  const { openid, nickname, platform } = req.body || {};
  if (!openid) {
    return res.status(400).json({ code: 400, msg: '缺少 openid' });
  }
  try {
    const user = await userModel.findOrCreate(openid, nickname, null, platform);
    res.json({
      userInfo: {
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        platform: user.platform,
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

module.exports = {
  wxLogin,
  tiktokLogin,
  init,
  saveProgress,
};
