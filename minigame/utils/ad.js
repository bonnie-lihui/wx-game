/**
 * 微信流量主广告接入：激励视频、插屏、Banner
 * 【广告位ID替换位】将各 adUnitId 替换为你在微信公众平台申请的广告位ID
 * 合规：不诱导点击、不强制观看，仅必要场景触发
 * @file utils/ad.js
 */

// ========== 广告位 ID（微信公众平台 - 流量主） ==========
const AD_IDS = {
  /** 激励视频 - 用于提示/复活/解锁 */
  REWARD_VIDEO: 'adunit-7b673782da969c7a',
  /** 插屏 - 结算后展示，5秒可跳过 */
  INTERSTITIAL: 'adunit-7b673782da969c7a',
  /** Banner - 首页/玩法页底部 */
  BANNER: 'adunit-7b673782da969c7a',
};

/** 插屏展示间隔(ms) */
const INTERSTITIAL_INTERVAL = 15 * 60 * 1000;
let lastInterstitialTime = 0;

/**
 * 在当前页面创建激励视频实例（必须在本页创建、本页 show，否则会报错）
 * 只绑定一次 onClose，避免「绑定多次 onClose」警告与重复回调
 * @returns {WechatMinigame.RewardedVideoAd|null}
 */
function createRewardedVideoAdForPage() {
  if (!wx.createRewardedVideoAd) return null;
  try {
    const ad = wx.createRewardedVideoAd({ adUnitId: AD_IDS.REWARD_VIDEO });
    ad._currentResolve = null;
    ad.onLoad(() => {
      console.log('[Ad] 激励视频加载成功');
    });
    ad.onError((err) => {
      console.warn('[Ad] 激励视频错误', err);
    });
    ad.onClose((res) => {
      if (ad._currentResolve) {
        ad._currentResolve(!!(res && res.isEnded));
        ad._currentResolve = null;
      }
      ad.load().catch(() => {});
    });
    return ad;
  } catch (e) {
    console.error('[Ad] 创建激励视频失败', e);
    return null;
  }
}

/**
 * 使用当前页创建的激励视频实例播放（解决「只能在创建广告的页面 show」报错）
 * @param {WechatMinigame.RewardedVideoAd|null} ad 本页 onLoad 时 createRewardedVideoAdForPage() 的返回值
 * @returns {Promise<boolean>} 是否完整观看至结束
 */
function showRewardedVideoForRewardWithInstance(ad) {
  if (!ad) return Promise.resolve(false);
  return new Promise((resolve) => {
    ad._currentResolve = resolve;
    ad.load()
      .then(() => ad.show())
      .catch((err) => {
        console.warn('[Ad] 激励视频加载/展示失败', err);
        if (ad._currentResolve) {
          ad._currentResolve(false);
          ad._currentResolve = null;
        }
      });
  });
}

/**
 * 创建激励视频广告（每次新建，兼容旧用法）
 * @returns {WechatMinigame.RewardedVideoAd|null}
 */
function createRewardedVideoAd() {
  try {
    const ad = wx.createRewardedVideoAd({
      adUnitId: AD_IDS.REWARD_VIDEO,
    });
    ad.onError(err => {
      console.warn('[Ad] 激励视频错误', err);
    });
    ad.onClose(res => {
      if (res && res.isEnded) {
        console.log('[Ad] 激励视频观看完成');
      }
    });
    return ad;
  } catch (e) {
    console.error('[Ad] 创建激励视频失败', e);
    return null;
  }
}

/**
 * 播放激励视频（需传入本页创建的实例，见 createRewardedVideoAdForPage）
 * @deprecated 请使用 createRewardedVideoAdForPage + showRewardedVideoForRewardWithInstance
 */
function showRewardedVideoForReward() {
  return Promise.resolve(false);
}

/**
 * 播放激励视频，观看完成后 resolve(true)（兼容旧用法，每次新建实例）
 * @returns {Promise<boolean>} 是否观看完成
 */
function showRewardedVideo() {
  return new Promise((resolve) => {
    const ad = createRewardedVideoAd();
    if (!ad) {
      resolve(false);
      return;
    }
    ad.onClose(res => {
      resolve(!!(res && res.isEnded));
    });
    ad.show().catch(err => {
      console.warn('[Ad] 激励视频展示失败', err);
      resolve(false);
    });
  });
}

/**
 * 创建插屏广告
 * @returns {WechatMinigame.InterstitialAd|null}
 */
function createInterstitialAd() {
  try {
    return wx.createInterstitialAd({
      adUnitId: AD_IDS.INTERSTITIAL,
    });
  } catch (e) {
    console.error('[Ad] 创建插屏失败', e);
    return null;
  }
}

/**
 * 展示插屏（带频率控制，约 15 分钟一次）
 * 插屏 5 秒可跳过由微信侧控制
 * @returns {Promise<boolean>}
 */
function showInterstitial() {
  const now = Date.now();
  if (now - lastInterstitialTime < INTERSTITIAL_INTERVAL) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const ad = createInterstitialAd();
    if (!ad) {
      resolve(false);
      return;
    }
    ad.onClose(() => {
      lastInterstitialTime = Date.now();
      resolve(true);
    });
    ad.onError(() => resolve(false));
    ad.show().then(() => resolve(true)).catch(() => resolve(false));
  });
}

/**
 * 创建 Banner 广告组件（需在页面 wxml 中放置 <ad> 或通过 Canvas 占位后由自定义组件展示）
 * 小游戏侧通常用 wx.createBannerAd 或 同层渲染 ad 组件
 * 返回广告实例，由调用方在合适节点挂载
 * @param {Object} style - { left, top, width, height }
 * @returns {WechatMinigame.BannerAd|null}
 */
function createBannerAd(style = {}) {
  try {
    const width = style.width || 300;
    const height = style.height || 80;
    const ad = wx.createBannerAd({
      adUnitId: AD_IDS.BANNER,
      style: {
        left: style.left != null ? style.left : 0,
        top: style.top != null ? style.top : 0,
        width,
        height,
      },
    });
    ad.onError(err => console.warn('[Ad] Banner 错误', err));
    return ad;
  } catch (e) {
    console.error('[Ad] 创建 Banner 失败', e);
    return null;
  }
}

module.exports = {
  AD_IDS,
  showRewardedVideo,
  showRewardedVideoForReward,
  createRewardedVideoAdForPage,
  showRewardedVideoForRewardWithInstance,
  showInterstitial,
  createBannerAd,
  createRewardedVideoAd,
  createInterstitialAd,
};
