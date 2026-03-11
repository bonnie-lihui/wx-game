/**
 * 微信小游戏分享配置
 */

function getShareConfig() {
  return {
    title: '国风轻玩合集 - 经典国风益智小游戏',
    desc: '来挑战国风益智游戏吧！',
    imageUrl: '',
  }
}

function setupShare() {
  if (typeof wx !== 'undefined' && wx.showShareMenu) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
  }

  if (typeof wx !== 'undefined' && wx.onShareAppMessage) {
    wx.onShareAppMessage(function () {
      var cfg = getShareConfig()
      return {
        title: cfg.title,
        imageUrl: cfg.imageUrl,
      }
    })
  }

  if (typeof wx !== 'undefined' && wx.onShareTimeline) {
    wx.onShareTimeline(function () {
      var cfg = getShareConfig()
      return {
        title: cfg.title,
        imageUrl: cfg.imageUrl,
      }
    })
  }
}

module.exports = {
  getShareConfig: getShareConfig,
  setupShare: setupShare,
}
