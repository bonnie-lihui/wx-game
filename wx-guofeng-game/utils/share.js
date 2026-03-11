/**
 * 裂变分享：海报生成、状态同步
 * 文案为原创国风短句，无诱导分享违规表述
 * @file utils/share.js
 */

const { drawPosterToCanvas } = require('./canvas.js');

/** 分享文案库（可扩展）- 合规：无诱导分享、无“分享即解锁”等利诱表述 */
const SHARE_TEXTS = [
  '墨韵轻玩，国风益智小游戏。',
  '一笔一画寻成语，国风轻玩等你来。',
  '诗词连线，古风雅趣，一起来玩。',
];

/**
 * 获取随机分享文案
 * @returns {string}
 */
function getShareText() {
  const i = Math.floor(Math.random() * SHARE_TEXTS.length);
  return SHARE_TEXTS[i];
}

/**
 * 生成分享海报（Canvas 绘制国风风格）
 * @param {Object} ctx - Canvas 2D 上下文
 * @param {Object} opts - { width, height, score, level, gameName }
 * @returns {Promise<void>}
 */
function generatePoster(ctx, opts = {}) {
  const width = opts.width || 750;
  const height = opts.height || 1000;
  const score = opts.score || 0;
  const level = opts.level || 1;
  const gameName = opts.gameName || '国风轻玩';

  return new Promise((resolve) => {
    try {
      drawPosterToCanvas(ctx, {
        width,
        height,
        title: gameName,
        subTitle: `第${level}关 · 得分 ${score}`,
        hint: getShareText(),
      });
      resolve();
    } catch (e) {
      console.error('[Share] 海报绘制失败', e);
      resolve();
    }
  });
}

/**
 * 分享成功回调（当前无需后端同步，直接返回成功）
 * @param {string} openid
 * @param {string} gameId
 * @returns {Promise<Object>}
 */
function onShareSuccess(openid, gameId) {
  return Promise.resolve({ success: true });
}

/**
 * 设置分享到朋友圈/好友的配置
 * @param {Object} options - { title, imageUrl, query }
 */
function setShareAppMessage(options = {}) {
  const title = options.title || getShareText();
  const imageUrl = options.imageUrl || ''; // 可填自定义图片 URL
  const query = options.query || '';
  return {
    title,
    imageUrl,
    query,
  };
}

/** 分享链接统一进入首页的 path */
const SHARE_PATH_INDEX = '/pages/index/index';

/**
 * 获取「分享给好友/群」配置：标题 + 固定进入首页
 * 用于各页面 onShareAppMessage  return 值
 */
function getShareAppMessageConfig() {
  return {
    title: getShareText(),
    path: SHARE_PATH_INDEX,
    imageUrl: '',
  };
}

/**
 * 获取「分享到朋友圈」配置：标题 + 无 query，由 app 从分享场景进入时统一跳首页
 * 用于各页面 onShareTimeline return 值
 */
function getShareTimelineConfig() {
  return {
    title: getShareText(),
    query: '',
    imageUrl: '',
  };
}

module.exports = {
  getShareText,
  generatePoster,
  onShareSuccess,
  setShareAppMessage,
  getShareAppMessageConfig,
  getShareTimelineConfig,
  SHARE_PATH_INDEX,
  SHARE_TEXTS,
};
