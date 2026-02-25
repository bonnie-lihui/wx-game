/**
 * 国风轻玩合集2.0 - 微信小游戏入口
 * 职责：接口初始化、全局配置、生命周期
 * @file game.js
 */

// ========== 全局配置（可在此调整） ==========
const GLOBAL_CONFIG = {
  /** 后端接口基础域名 - 【自有域名替换位】替换为你的服务器域名，如 https://api.yourdomain.com */
  API_BASE: 'https://vx-game.solaboom.cn',
  // API_BASE: 'http://localhost:5565',
  /** 默认超时(ms) */
  REQUEST_TIMEOUT: 10000,
  /** 插屏广告展示间隔(分钟) */
  INTERSTITIAL_INTERVAL_MIN: 15,
};

// 全局单例，供各页面使用
let gameInstance = null;
let isLoginInProgress = false; // 登录进行中标记

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
   * 初始化：获取系统信息、微信无感登录
   */
  init() {
    // 如果已登录，直接返回
    if (this.userInfo && this.userInfo.openid) {
      console.log('[Game] 已登录，跳过');
      return Promise.resolve({ 
        systemInfo: this.systemInfo, 
        userInfo: this.userInfo, 
        unlockList: this.unlockList 
      });
    }

    // 如果正在登录，拒绝重复请求
    if (isLoginInProgress) {
      console.log('[Game] 登录进行中，拒绝重复请求');
      return Promise.reject(new Error('登录进行中'));
    }

    isLoginInProgress = true;

    return new Promise((resolve, reject) => {
      try {
        this.systemInfo = wx.getSystemInfoSync();
        
        // 微信无感登录
        wx.login({
          success: (res) => {
            if (res.code) {
              // 调用后端接口
              this._doWxLogin(res.code)
                .then(result => {
                  isLoginInProgress = false;
                  resolve(result);
                })
                .catch(err => {
                  isLoginInProgress = false;
                  reject(err);
                });
            } else {
              isLoginInProgress = false;
              reject(new Error('获取登录凭证失败'));
            }
          },
          fail: (err) => {
            isLoginInProgress = false;
            console.error('[Game] wx.login 失败', err);
            reject(err);
          }
        });
      } catch (e) {
        isLoginInProgress = false;
        console.error('[Game] init error:', e);
        reject(e);
      }
    });
  }

  /**
   * 调用后端接口完成登录
   * @private
   */
  _doWxLogin(code) {
    const api = require('./utils/api.js');
    return api.wxLogin(code)
      .then((res) => {
        if (res.success) {
          this.userInfo = res.userInfo || {};
          this.unlockList = res.unlockList || { games: [], themes: [], hidden: false };
          console.log('[Game] 登录成功', this.userInfo);
          return { 
            systemInfo: this.systemInfo, 
            userInfo: this.userInfo, 
            unlockList: this.unlockList 
          };
        } else {
          throw new Error(res.msg || '登录失败');
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
 * 获取游戏实例（懒加载，不自动登录）
 */
function getGameInstance() {
  if (!gameInstance) {
    console.log('[Game] 创建游戏实例');
    gameInstance = new Game();
  }
  return gameInstance;
}

// 导出供页面使用
module.exports = {
  getGame: getGameInstance,
  GLOBAL_CONFIG,
};

console.log('[Game] game.js 加载完成（延迟登录）');
