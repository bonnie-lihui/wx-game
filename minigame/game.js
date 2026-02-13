/**
 * 国风轻玩合集2.0 - 微信小游戏入口
 * 职责：接口初始化、全局配置、生命周期
 * @file game.js
 */

// ========== 全局配置（可在此调整） ==========
const GLOBAL_CONFIG = {
  /** 后端接口基础域名 - 【自有域名替换位】替换为你的服务器域名，如 https://api.yourdomain.com */
  API_BASE: 'http://localhost:3000',
  /** 默认超时(ms) */
  REQUEST_TIMEOUT: 10000,
  /** 插屏广告展示间隔(分钟) */
  INTERSTITIAL_INTERVAL_MIN: 15,
};

// 全局单例，供各页面使用
let gameInstance = null;

/**
 * 游戏主类 - 负责初始化与全局状态
 */
class Game {
  constructor() {
    this.config = GLOBAL_CONFIG;
    this.userInfo = null;
    this.unlockList = { games: [], themes: [], hidden: false };
    this.systemInfo = null;
  }

  /**
   * 初始化：获取系统信息、初始化用户（若已登录）
   */
  init() {
    return new Promise((resolve, reject) => {
      try {
        this.systemInfo = wx.getSystemInfoSync();
        // 可在此调用 /api/user/init 拉取用户数据，此处仅做占位
        resolve({ systemInfo: this.systemInfo });
      } catch (e) {
        console.error('[Game] init error:', e);
        reject(e);
      }
    });
  }

  /** 获取画布适配后的设计宽高（默认 750 设计稿） */
  getDesignSize() {
    const sys = this.systemInfo || wx.getSystemInfoSync();
    const width = sys.windowWidth || 375;
    const height = sys.windowHeight || 667;
    return { designWidth: 750, designHeight: 1334, windowWidth: width, windowHeight: height };
  }
}

/**
 * 小游戏入口
 */
function main() {
  console.log('[Game] main() 执行');
  gameInstance = new Game();
  gameInstance.init().then(() => {
    console.log('[Game] 国风轻玩合集2.0 初始化完成', { windowWidth: gameInstance.systemInfo && gameInstance.systemInfo.windowWidth, windowHeight: gameInstance.systemInfo && gameInstance.systemInfo.windowHeight });
  }).catch(err => {
    console.error('[Game] 初始化失败', err);
  });
}

// 导出供页面使用
module.exports = {
  getGame: () => gameInstance,
  GLOBAL_CONFIG,
};

main();
