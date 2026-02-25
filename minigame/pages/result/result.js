/**
 * 结算页：WXML 布局展示过关/失败结果
 * @file pages/result/result.js
 */

var GAME_NAMES = {
  wordFind: '国风找成语',
  charDiff: '汉字找不同',
  poetryConnect: '诗词连线',
};

var GAME_ICONS = {
  wordFind: '📜',
  charDiff: '🔍',
  poetryConnect: '🖌️',
};

var share = require('../../utils/share.js');

Page({
  data: {
    gameId: '',
    level: 1,
    success: false,
    score: 0,
    remaining: 0,
    total: 0,
    gameName: '游戏',
    gameIcon: '🎮',
    resultEmoji: '💪',
    resultText: '再接再厉',
    timeText: '',
  },

  onShareAppMessage: function() {
    return share.getShareAppMessageConfig();
  },

  onShareTimeline: function() {
    return share.getShareTimelineConfig();
  },

  onLoad: function(options) {
    console.log('[Result] onLoad', JSON.stringify(options));
    var gameId = options.gameId || '';
    var level = parseInt(options.level, 10) || 1;
    var success = options.success === '1';
    var score = parseInt(options.score, 10) || 0;
    var remaining = parseInt(options.remaining, 10) || 0;
    var total = parseInt(options.total, 10) || 0;

    var timeText = '';
    if (total > 0) {
      var used = total - remaining;
      if (success) {
        timeText = '用时 ' + used + '秒（剩余' + remaining + '秒）';
      } else {
        timeText = '时间到！共 ' + total + '秒';
      }
    }

    this.setData({
      gameId: gameId,
      level: level,
      success: success,
      score: score,
      remaining: remaining,
      total: total,
      gameName: GAME_NAMES[gameId] || '游戏',
      gameIcon: GAME_ICONS[gameId] || '🎮',
      resultEmoji: success ? '🎉' : (remaining <= 0 && total > 0 ? '⏰' : '💪'),
      resultText: success ? '恭喜过关！' : (remaining <= 0 && total > 0 ? '时间到！' : '再接再厉'),
      timeText: timeText,
    });
  },

  /** 主按钮：下一关 / 再试一次 */
  onMainBtn: function() {
    var data = this.data;
    // 成功：进入下一关；失败：从第1关重新开始
    var nextLevel = data.success ? data.level + 1 : 1;
    // 如果是下一关（成功后），自动开始游戏；如果是再试一次（失败后），也自动开始
    wx.redirectTo({
      url: '/pages/game/game?gameId=' + data.gameId + '&level=' + nextLevel + '&autoStart=1',
    });
  },

  /** 返回首页 */
  onGoHome: function() {
    wx.reLaunch({
      url: '/pages/index/index',
    });
  },
});
