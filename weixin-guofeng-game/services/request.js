/**
 * 网络请求封装：wx.request 统一拦截、重试、签名、token 注入
 *
 * 自动从 GameGlobal.userState 读取 token 并附加到请求头。
 * 遇到 401 时自动触发 reLogin 后重发一次原始请求。
 */

var BASE_URL = 'https://mini-game.solaboom.cn'
// var BASE_URL = 'http://localhost:5565'
// var BASE_URL = 'http://172.18.188.222:5565'
var TIMEOUT = 10000
var MAX_RETRY = 0

function simpleSign(data) {
  var str = typeof data === 'string' ? data : JSON.stringify(data || {})
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + c
    hash = hash & hash
  }
  return String(Math.abs(hash))
}

function getAuthToken() {
  try {
    return (GameGlobal.userState && GameGlobal.userState.token) || ''
  } catch (e) {
    return ''
  }
}

function request(url, options, retryCount) {
  options = options || {}
  retryCount = retryCount || 0
  var method = (options.method || 'GET').toUpperCase()
  var data = options.data || {}
  var header = {
    'content-type': 'application/json',
    'X-Client': 'wechat-minigame',
  }
  if (options.header) {
    for (var k in options.header) header[k] = options.header[k]
  }

  var token = getAuthToken()
  if (token) {
    header['Authorization'] = 'Bearer ' + token
  }

  var sign = simpleSign(method === 'GET' ? url : data)
  header['X-Sign'] = sign

  return new Promise(function (resolve, reject) {
    wx.request({
      url: BASE_URL + url,
      method: method,
      data: data,
      header: header,
      timeout: TIMEOUT,
      success: function (res) {
        var code = res.statusCode

        if (code >= 200 && code < 300) {
          resolve(res.data || {})
          return
        }

        if (code === 401 && retryCount === 0) {
          console.warn('[Request] 401 detected, trigger reLogin')
          try {
            var auth = require('../utils/auth')
            auth.reLogin().then(function () {
              request(url, options, retryCount + 1).then(resolve).catch(reject)
            }).catch(function () {
              reject(new Error('reLogin failed'))
            })
          } catch (e) {
            reject(new Error('reLogin module error'))
          }
          return
        }

        if (retryCount < MAX_RETRY && code >= 500) {
          setTimeout(function () {
            request(url, options, retryCount + 1).then(resolve).catch(reject)
          }, 500 * (retryCount + 1))
          return
        }

        reject(new Error((res.data && res.data.msg) || ('HTTP ' + code)))
      },
      fail: function (err) {
        if (retryCount < MAX_RETRY && (err.errMsg || '').indexOf('timeout') >= 0) {
          setTimeout(function () {
            request(url, options, retryCount + 1).then(resolve).catch(reject)
          }, 500 * (retryCount + 1))
          return
        }
        reject(err)
      },
    })
  })
}

function get(url, data) {
  return request(url, { method: 'GET', data: data || {} })
}

function post(url, data) {
  return request(url, { method: 'POST', data: data || {} })
}

module.exports = {
  BASE_URL: BASE_URL,
  request: request,
  get: get,
  post: post,
}
