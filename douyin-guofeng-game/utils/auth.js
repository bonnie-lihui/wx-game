/**
 * 抖音小游戏登录 + 用户状态管理
 *
 * 登录流程：
 *   1. 检查本地缓存的 token 是否存在
 *   2. 用 tt.checkSession() 判断会话是否过期
 *   3. 会话有效 → 直接复用本地 token
 *   4. 会话过期 → tt.login() 获取 code → 后端换取 token + openid
 *   5. 将 token / openid 缓存到本地
 *
 * 对外暴露 userState 挂到 GameGlobal，其它模块可直接读取
 */

var api = require('../services/api')

var STORAGE_KEY_TOKEN = 'gg_auth_token'
var STORAGE_KEY_OPENID = 'gg_auth_openid'
var STORAGE_KEY_USER = 'gg_auth_user'

var userState = {
  userInfo: null,
  unlockList: { games: [], themes: [], hidden: false },
  isLoggedIn: false,
  isLoggingIn: false,
  openid: '',
  token: '',
}

GameGlobal.userState = userState

// ---------- 本地缓存读写 ----------

function saveToStorage() {
  try {
    if (userState.token) tt.setStorageSync(STORAGE_KEY_TOKEN, userState.token)
    if (userState.openid) tt.setStorageSync(STORAGE_KEY_OPENID, userState.openid)
    if (userState.userInfo) tt.setStorageSync(STORAGE_KEY_USER, JSON.stringify(userState.userInfo))
  } catch (e) {
    console.warn('[Auth] saveToStorage fail', e)
  }
}

function loadFromStorage() {
  try {
    userState.token = tt.getStorageSync(STORAGE_KEY_TOKEN) || ''
    userState.openid = tt.getStorageSync(STORAGE_KEY_OPENID) || ''
    var raw = tt.getStorageSync(STORAGE_KEY_USER)
    if (raw) userState.userInfo = JSON.parse(raw)
  } catch (e) {
    console.warn('[Auth] loadFromStorage fail', e)
  }
}

function clearStorage() {
  try {
    tt.removeStorageSync(STORAGE_KEY_TOKEN)
    tt.removeStorageSync(STORAGE_KEY_OPENID)
    tt.removeStorageSync(STORAGE_KEY_USER)
  } catch (e) { /* ignore */ }
}

// ---------- 公共读取方法 ----------

function getOpenid() {
  return userState.openid || 'guest'
}

function getToken() {
  return userState.token || ''
}

function isGameUnlocked(gameId) {
  var defaultGames = ['wordFind', 'charDiff', 'poetryConnect']
  if (defaultGames.indexOf(gameId) >= 0) return true
  return userState.unlockList.games.indexOf(gameId) >= 0
}

// ---------- 会话检查 ----------

function checkSession() {
  return new Promise(function (resolve) {
    tt.checkSession({
      success: function () { resolve(true) },
      fail: function () { resolve(false) },
    })
  })
}

// ---------- 核心登录 ----------

function doLogin() {
  return new Promise(function (resolve, reject) {
    tt.login({
      success: function (res) {
        if (!res.code) {
          reject(new Error('tt.login 未返回 code'))
          return
        }
        console.log('[Auth] tt.login code obtained')

        api.ttLogin(res.code).then(function (data) {
          if (data && data.success) {
            if (data.token) userState.token = data.token
            if (data.userInfo) {
              userState.userInfo = data.userInfo
              userState.openid = data.userInfo.openid || ''
            }
            if (data.openid) userState.openid = data.openid
            if (data.unlockList) userState.unlockList = data.unlockList
            userState.isLoggedIn = true
            saveToStorage()
          }
          resolve(userState)
        }).catch(function (err) {
          console.warn('[Auth] ttLogin api fail', err)
          reject(err)
        })
      },
      fail: function (err) {
        console.warn('[Auth] tt.login fail', err)
        reject(err)
      },
    })
  })
}

/**
 * 登录入口（防重入）
 * 会话有效且本地有 token → 跳过 tt.login，直接复用
 * 否则走全量登录
 */
function login() {
  if (userState.isLoggingIn) return Promise.resolve(userState)
  userState.isLoggingIn = true

  loadFromStorage()

  var hasLocal = !!(userState.token && userState.openid)

  var flow = hasLocal
    ? checkSession().then(function (valid) {
        if (valid) {
          console.log('[Auth] session valid, reuse token')
          userState.isLoggedIn = true
          return userState
        }
        console.log('[Auth] session expired, re-login')
        return doLogin()
      })
    : doLogin()

  return flow
    .catch(function (err) {
      console.warn('[Auth] login flow error, fallback guest', err)
      return userState
    })
    .then(function (state) {
      userState.isLoggingIn = false
      return state
    })
}

/**
 * 强制重新登录（token 过期或后端返回 401 时调用）
 */
function reLogin() {
  clearStorage()
  userState.token = ''
  userState.openid = ''
  userState.isLoggedIn = false
  userState.isLoggingIn = false
  return login()
}

// ---------- 初始化 ----------

function init() {
  return login()
}

// ---------- 业务更新 ----------

function updateUnlockList(unlockList) {
  if (unlockList) {
    userState.unlockList = unlockList
  }
}

module.exports = {
  userState: userState,
  getOpenid: getOpenid,
  getToken: getToken,
  isGameUnlocked: isGameUnlocked,
  login: login,
  reLogin: reLogin,
  init: init,
  updateUnlockList: updateUnlockList,
}
