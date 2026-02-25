/**
 * 首页 HTML 版本：使用 WXML + CSS 实现
 * 对比 Canvas 版本的性能和效果
 * @file pages/index-html/index-html.js
 */

const { getGame } = require('../../game.js');
const share = require('../../utils/share.js');

const GAMES = [
  { id: 'wordFind',        name: '找成语',     icon: '📜', colors: ['#FFF5F0', '#FFE8DC'], levels: '⭐⭐⭐', unlocked: false },
  { id: 'charDiff',        name: '汉字找不同', icon: '🔍', colors: ['#FFF8EE', '#FFECD2'], levels: '⭐⭐',   unlocked: false },
  { id: 'poetryConnect',   name: '诗词连线',   icon: '🖌️', colors: ['#F0F7FF', '#DCE8F5'], levels: '⭐⭐⭐', unlocked: false },
];

Page({
  data: {
    games: GAMES,
  },

  onLoad() {
    console.log('[Index-HTML] onLoad');
    this.loadUnlockStatus();
  },

  onShareAppMessage() {
    return share.getShareAppMessageConfig();
  },

  onShareTimeline() {
    return share.getShareTimelineConfig();
  },

  onShow() {
    console.log('[Index-HTML] onShow - 刷新解锁状态');
    this.loadUnlockStatus();
  },

  /**
   * 加载游戏解锁状态
   */
  loadUnlockStatus() {
    try {
      const game = getGame();
      if (!game || !game.unlockList) {
        console.warn('[Index-HTML] 未获取到游戏实例或解锁列表');
        return;
      }

      const unlockList = game.unlockList.games || [];
      console.log('[Index-HTML] 解锁列表:', unlockList);

      // 更新每个游戏的解锁状态
      const updatedGames = this.data.games.map(item => ({
        ...item,
        unlocked: unlockList.indexOf(item.id) >= 0,
      }));

      this.setData({ games: updatedGames });
      console.log('[Index-HTML] 游戏状态已更新');

    } catch (error) {
      // 遵循 HelloGroup 规范：不吞异常，记录错误并上报
      console.error('[Index-HTML] 加载解锁状态失败:', error);
      // TODO: 接入 Hubble 告警系统
      // Hubble.report('index_html_load_unlock_status_error', { error: error.message });
      
      // 降级处理：使用默认状态
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000,
      });
    }
  },

  /**
   * 点击卡片事件
   */
  onCardTap(e) {
    try {
      const game = e.currentTarget.dataset.game;
      
      if (!game || !game.id) {
        console.error('[Index-HTML] 无效的游戏数据:', game);
        throw new Error('游戏数据无效');
      }

      console.log('[Index-HTML] 点击游戏卡片:', game.name);

      // 检查是否已解锁
      if (!game.unlocked) {
        wx.showToast({
          title: '该游戏尚未解锁',
          icon: 'none',
          duration: 2000,
        });
        return;
      }

      // 导航到游戏页面
      wx.navigateTo({
        url: `/pages/game/game?gameId=${game.id}`,
        fail: (err) => {
          console.error('[Index-HTML] 页面跳转失败:', err);
          wx.showToast({
            title: '跳转失败，请重试',
            icon: 'none',
          });
        }
      });

    } catch (error) {
      // 遵循 HelloGroup 规范：精准捕获异常，记录并上报
      console.error('[Index-HTML] 卡片点击处理失败:', error);
      // TODO: 接入 Hubble 告警系统
      // Hubble.report('index_html_card_tap_error', { 
      //   error: error.message,
      //   stack: error.stack 
      // });
      
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none',
      });
    }
  },
});
