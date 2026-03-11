/**
 * 微信小游戏登录 + 用户状态管理
 *
 * 登录流程：
 *   1. 检查本地缓存的 token 是否存在
 *   2. 用 wx.checkSession() 判断会话是否过期
 *   3. 会话有效 → 直接复用本地 token
 *   4. 会话过期 → wx.login() 获取 code → 后端换取 token + openid
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

function saveToStorage() {
  try {
    if (userState.token) wx.setStorageSync(STORAGE_KEY_TOKEN, userState.token)
    if (userState.openid) wx.setStorageSync(STORAGE_KEY_OPENID, userState.openid)
    if (userState.userInfo) wx.setStorageSync(STORAGE_KEY_USER, JSON.stringify(userState.userInfo))
  } catch (e) {
    console.warn('[Auth] saveToStorage fail', e)
  }
}

function loadFromStorage() {
  try {
    userState.token = wx.getStorageSync(STORAGE_KEY_TOKEN) || ''
    userState.openid = wx.getStorageSync(STORAGE_KEY_OPENID) || ''
    var raw = wx.getStorageSync(STORAGE_KEY_USER)
    if (raw) userState.userInfo = JSON.parse(raw)
  } catch (e) {
    console.warn('[Auth] loadFromStorage fail', e)
  }
}

function clearStorage() {
  try {
    wx.removeStorageSync(STORAGE_KEY_TOKEN)
    wx.removeStorageSync(STORAGE_KEY_OPENID)
    wx.removeStorageSync(STORAGE_KEY_USER)
  } catch (e) { /* ignore */ }
}

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

function checkSession() {
  return new Promise(function (resolve) {
    wx.checkSession({
      success: function () { resolve(true) },
      fail: function () { resolve(false) },
    })
  })
}

function doLogin() {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (res) {
        if (!res.code) {
          reject(new Error('wx.login 未返回 code'))
          return
        }
        console.log('[Auth] wx.login code obtained')

        api.wxLogin(res.code).then(function (data) {
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
          console.warn('[Auth] wxLogin api fail', err)
          reject(err)
        })
      },
      fail: function (err) {
        console.warn('[Auth] wx.login fail', err)
        reject(err)
      },
    })
  })
}

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

function reLogin() {
  clearStorage()
  userState.token = ''
  userState.openid = ''
  userState.isLoggedIn = false
  userState.isLoggingIn = false
  return login()
}

function init() {
  return login()
}

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
