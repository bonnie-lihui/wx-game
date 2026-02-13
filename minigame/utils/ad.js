/**
 * 微信流量主广告接入：激励视频、插屏、Banner
 * 【广告位ID替换位】将各 adUnitId 替换为你在微信公众平台申请的广告位ID
 * 合规：不诱导点击、不强制观看，仅必要场景触发
 * @file utils/ad.js
 */

// ========== 广告位 ID（替换为你的） ==========
const AD_IDS = {
  /** 激励视频 - 用于提示/复活/解锁 */
  REWARD_VIDEO: 'your_reward_video_ad_unit_id',
  /** 插屏 - 结算后展示，5秒可跳过 */
  INTERSTITIAL: 'your_interstitial_ad_unit_id',
  /** Banner - 首页/玩法页底部 */
  BANNER: 'your_banner_ad_unit_id',
};

/** 插屏展示间隔(ms) */
const INTERSTITIAL_INTERVAL = 15 * 60 * 1000;
let lastInterstitialTime = 0;

/**
 * 创建激励视频广告
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
 * 播放激励视频，观看完成后 resolve(true)
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
  showInterstitial,
  createBannerAd,
  createRewardedVideoAd,
  createInterstitialAd,
};
