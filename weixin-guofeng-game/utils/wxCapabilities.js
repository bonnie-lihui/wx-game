/**
 * 微信小游戏平台能力接入
 *
 * - 添加到桌面（我的小程序）
 * - 激励视频 / 插屏广告
 * - 订阅消息
 */

var AD_IDS = {
  REWARD_VIDEO: '',
  INTERSTITIAL: '',
}

var INTERSTITIAL_INTERVAL = 15 * 60 * 1000
var _lastInterstitialTime = 0
var _rewardAd = null
var _interstitialAd = null
var _desktopPrompted = false

function promptAddToDesktop() {
  if (_desktopPrompted) return
  _desktopPrompted = true
  if (typeof wx === 'undefined') return

  try {
    if (wx.showModal) {
      wx.showModal({
        title: '提示',
        content: '将「国风轻玩」添加到「我的小程序」，方便下次快速打开',
        showCancel: true,
        cancelText: '下次再说',
        confirmText: '去添加',
        success: function (res) {
          if (res.confirm) {
            console.log('[WX] 用户同意添加到我的小程序')
          }
        },
      })
    }
  } catch (e) {
    console.warn('[WX] promptAddToDesktop fail', e)
  }
}

function initRewardedVideoAd() {
  if (typeof wx === 'undefined' || !wx.createRewardedVideoAd) return null
  if (!AD_IDS.REWARD_VIDEO) return null
  try {
    _rewardAd = wx.createRewardedVideoAd({ adUnitId: AD_IDS.REWARD_VIDEO })
    _rewardAd.onError(function (err) {
      console.warn('[WX Ad] 激励视频错误', err)
    })
    return _rewardAd
  } catch (e) {
    console.error('[WX Ad] 创建激励视频失败', e)
    return null
  }
}

function showRewardedVideo() {
  if (!_rewardAd) _rewardAd = initRewardedVideoAd()
  if (!_rewardAd) return Promise.resolve(false)
  return new Promise(function (resolve) {
    var onClose = function (res) {
      _rewardAd.offClose(onClose)
      resolve(!!(res && res.isEnded))
    }
    _rewardAd.onClose(onClose)
    _rewardAd.load()
      .then(function () { return _rewardAd.show() })
      .catch(function (err) {
        console.warn('[WX Ad] 激励视频展示失败', err)
        _rewardAd.offClose(onClose)
        resolve(false)
      })
  })
}

function showInterstitial() {
  if (typeof wx === 'undefined' || !wx.createInterstitialAd) return Promise.resolve(false)
  if (!AD_IDS.INTERSTITIAL) return Promise.resolve(false)
  var now = Date.now()
  if (now - _lastInterstitialTime < INTERSTITIAL_INTERVAL) return Promise.resolve(false)
  return new Promise(function (resolve) {
    try {
      _interstitialAd = wx.createInterstitialAd({ adUnitId: AD_IDS.INTERSTITIAL })
      _interstitialAd.onClose(function () {
        _lastInterstitialTime = Date.now()
        resolve(true)
      })
      _interstitialAd.onError(function () { resolve(false) })
      _interstitialAd.load()
        .then(function () { return _interstitialAd.show() })
        .catch(function () { resolve(false) })
    } catch (e) {
      resolve(false)
    }
  })
}

function requestSubscribeMessage(tmplIds) {
  if (typeof wx === 'undefined' || !wx.requestSubscribeMessage) return Promise.resolve(false)
  if (!tmplIds || !tmplIds.length) return Promise.resolve(false)
  return new Promise(function (resolve) {
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: function (res) {
        console.log('[WX] 订阅消息结果', res)
        resolve(true)
      },
      fail: function (err) {
        console.warn('[WX] 订阅消息失败', err)
        resolve(false)
      },
    })
  })
}

module.exports = {
  AD_IDS: AD_IDS,
  promptAddToDesktop: promptAddToDesktop,
  initRewardedVideoAd: initRewardedVideoAd,
  showRewardedVideo: showRewardedVideo,
  showInterstitial: showInterstitial,
  requestSubscribeMessage: requestSubscribeMessage,
}
