/**
 * 抖音小游戏分享配置
 */

function getShareConfig() {
  return {
    title: '国风轻玩合集 - 经典国风益智小游戏',
    desc: '来挑战国风益智游戏吧！',
    imageUrl: '',
  }
}

function setupShare() {
  if (typeof tt !== 'undefined' && tt.showShareMenu) {
    tt.showShareMenu({
      withShareTicket: true,
    })
  }
}

module.exports = {
  getShareConfig: getShareConfig,
  setupShare: setupShare,
}
