/**
 * 后端接口封装：请求拦截、错误处理、超时与重试
 * 【自有域名替换位】在 GAME_CONFIG.API_BASE 或此处 BASE_URL 中替换为你的服务器域名
 * @file utils/api.js
 */

const game = require('../game.js');
const GAME_CONFIG = game.GLOBAL_CONFIG || {};

/** 接口基础地址 - 与 game.js 中保持一致，便于统一替换 */
const BASE_URL = GAME_CONFIG.API_BASE || 'https://your-domain.com';

/** 超时时间(ms)，默认 10s */
const TIMEOUT = GAME_CONFIG.REQUEST_TIMEOUT || 10000;

/** 最大重试次数 */
const MAX_RETRY = 3;

/**
 * 简单请求签名（防篡改，可选增强为 HMAC）
 * @param {Object} data - 请求体
 * @returns {string}
 */
function simpleSign(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data || {});
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
  }
  return String(Math.abs(hash));
}

/**
 * 发起请求（带重试）
 * @param {string} url - 相对路径，如 /api/user/init
 * @param {Object} options - { method, data, header }
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise<Object>}
 */
function request(url, options = {}, retryCount = 0) {
  const method = (options.method || 'GET').toUpperCase();
  const data = options.data || {};
  const header = Object.assign({
    'content-type': 'application/json',
    'X-Client': 'wechat-minigame',
  }, options.header || {});

  const sign = simpleSign(method === 'GET' ? url : data);
  header['X-Sign'] = sign;

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data: method === 'GET' ? data : data,
      header,
      timeout: TIMEOUT,
      success: (res) => {
        const code = res.statusCode;
        if (code >= 200 && code < 300) {
          resolve(res.data || {});
          return;
        }
        if (retryCount < MAX_RETRY && code >= 500) {
          setTimeout(() => {
            request(url, options, retryCount + 1).then(resolve).catch(reject);
          }, 500 * (retryCount + 1));
          return;
        }
        reject(new Error((res.data && res.data.msg) || ('HTTP ' + code)));
      },
      fail: (err) => {
        if (retryCount < MAX_RETRY && (err.errMsg || '').indexOf('timeout') >= 0) {
          setTimeout(() => {
            request(url, options, retryCount + 1).then(resolve).catch(reject);
          }, 500 * (retryCount + 1));
          return;
        }
        reject(err);
      },
    });
  });
}

/**
 * GET 请求
 */
function get(url, data = {}) {
  return request(url, { method: 'GET', data });
}

/**
 * POST 请求
 */
function post(url, data = {}) {
  return request(url, { method: 'POST', data });
}

// ========== 业务接口封装 ==========

/** 初始化用户 */
function userInit(openid, nickname) {
  return post('/api/user/init', { openid, nickname });
}

/** 保存进度 */
function saveProgress(openid, gameId, level) {
  return post('/api/user/saveProgress', { openid, gameId, level });
}

/** 解锁玩法 */
function unlockGame(openid, gameId, type) {
  return post('/api/user/unlockGame', { openid, gameId, type });
}

/** 解锁隐藏玩法 */
function unlockHidden(openid) {
  return post('/api/user/unlockHidden', { openid });
}

/** 获取关卡数据 */
function getLevelData(gameId, difficulty, level, openid, themeId, resetProgress) {
  return get('/api/level/getLevelData', { 
    gameId, 
    difficulty, 
    level, 
    openid, 
    themeId,
    resetProgress: resetProgress ? '1' : '0'
  });
}

/** 获取主题包数据 */
function getThemeData(themeId) {
  return get('/api/level/getThemeData', { themeId });
}

/** 分享成功回调 */
function shareSuccess(openid, gameId) {
  return post('/api/user/shareSuccess', { openid, gameId });
}

module.exports = {
  BASE_URL,
  request,
  get,
  post,
  userInit,
  saveProgress,
  unlockGame,
  unlockHidden,
  getLevelData,
  getThemeData,
  shareSuccess,
};
