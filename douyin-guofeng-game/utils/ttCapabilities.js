/**
 * 抖音小游戏平台能力接入
 *
 * - 侧边栏复访（必须，否则审核拒绝）
 * - 添加到桌面快捷方式
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
var _sidebarShown = false

function checkSidebarScene() {
  if (_sidebarShown) return
  if (typeof tt === 'undefined' || !tt.navigateToScene) return
  _sidebarShown = true
  tt.checkScene({
    scene: 'sidebar',
    success: function (res) {
      if (res && res.isExist) {
        console.log('[TT] 已在侧边栏，无需再引导')
        return
      }
      tt.navigateToScene({
        scene: 'sidebar',
        success: function () {
          console.log('[TT] 侧边栏引导成功')
        },
        fail: function (err) {
          console.warn('[TT] 侧边栏引导失败', err)
        },
      })
    },
    fail: function () {
      tt.navigateToScene({
        scene: 'sidebar',
        success: function () {
          console.log('[TT] 侧边栏引导成功')
        },
        fail: function (err) {
          console.warn('[TT] 侧边栏引导失败', err)
        },
      })
    },
  })
}

function addToDesktop() {
  if (typeof tt === 'undefined' || !tt.addShortcut) return Promise.resolve(false)
  return new Promise(function (resolve) {
    tt.addShortcut({
      success: function () {
        console.log('[TT] 添加到桌面成功')
        resolve(true)
      },
      fail: function (err) {
        console.warn('[TT] 添加到桌面失败', err)
        resolve(false)
      },
    })
  })
}

function initRewardedVideoAd() {
  if (typeof tt === 'undefined' || !tt.createRewardedVideoAd) return null
  if (!AD_IDS.REWARD_VIDEO) return null
  try {
    _rewardAd = tt.createRewardedVideoAd({ adUnitId: AD_IDS.REWARD_VIDEO })
    _rewardAd.onError(function (err) {
      console.warn('[TT Ad] 激励视频错误', err)
    })
    return _rewardAd
  } catch (e) {
    console.error('[TT Ad] 创建激励视频失败', e)
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
        console.warn('[TT Ad] 激励视频展示失败', err)
        _rewardAd.offClose(onClose)
        resolve(false)
      })
  })
}

function showInterstitial() {
  if (typeof tt === 'undefined' || !tt.createInterstitialAd) return Promise.resolve(false)
  if (!AD_IDS.INTERSTITIAL) return Promise.resolve(false)
  var now = Date.now()
  if (now - _lastInterstitialTime < INTERSTITIAL_INTERVAL) return Promise.resolve(false)
  return new Promise(function (resolve) {
    try {
      _interstitialAd = tt.createInterstitialAd({ adUnitId: AD_IDS.INTERSTITIAL })
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
  if (typeof tt === 'undefined' || !tt.requestSubscribeMessage) return Promise.resolve(false)
  if (!tmplIds || !tmplIds.length) return Promise.resolve(false)
  return new Promise(function (resolve) {
    tt.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: function (res) {
        console.log('[TT] 订阅消息结果', res)
        resolve(true)
      },
      fail: function (err) {
        console.warn('[TT] 订阅消息失败', err)
        resolve(false)
      },
    })
  })
}

module.exports = {
  AD_IDS: AD_IDS,
  checkSidebarScene: checkSidebarScene,
  addToDesktop: addToDesktop,
  initRewardedVideoAd: initRewardedVideoAd,
  showRewardedVideo: showRewardedVideo,
  showInterstitial: showInterstitial,
  requestSubscribeMessage: requestSubscribeMessage,
}
