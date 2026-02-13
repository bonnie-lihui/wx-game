/**
 * AI 造句评分：可选接入腾讯混元 API
 * @file server-node/controller/aiController.js
 */

const config = require('../config');

/**
 * POST /api/ai/sentenceScore
 * 入参：sentence, theme
 * 出参：score (0-100), comment
 */
async function sentenceScore(req, res) {
  const { sentence, theme } = req.body || {};
  if (!sentence || typeof sentence !== 'string') {
    return res.status(400).json({ code: 400, msg: '缺少 sentence' });
  }
  const text = String(sentence).trim().slice(0, 200);
  if (!text) {
    return res.json({ score: 0, comment: '请输入有效句子' });
  }
  try {
    if (config.hunyuan.secretId && config.hunyuan.secretId !== 'your_secret_id') {
      const result = await callHunyuanScore(text, theme);
      return res.json(result);
    }
    const score = Math.min(100, Math.floor(text.length * 2) + Math.floor(Math.random() * 20));
    const comment = '（演示评分，配置混元密钥后可返回 AI 评语）';
    res.json({ score, comment });
  } catch (e) {
    console.error('[aiController.sentenceScore]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

/**
 * 调用腾讯混元 API 评分（需配置 config.hunyuan）
 * @param {string} text
 * @param {string} theme
 * @returns {Promise<{ score: number, comment: string }>}
 */
async function callHunyuanScore(text, theme) {
  try {
    const Hunyuan = require('tencentcloud-sdk-nodejs-hunyuan').v20230901.Hunyuan;
    const client = new Hunyuan.Client({
      secretId: config.hunyuan.secretId,
      secretKey: config.hunyuan.secretKey,
    });
    const prompt = `请对以下造句从创意、通顺、贴合主题「${theme || '通用'}」三方面打分(0-100)，并给一句简短评语。只输出JSON：{"score":数字,"comment":"评语"}。造句：${text}`;
    const resp = await client.ChatCompletions({ Messages: [{ Role: 'user', Content: prompt }] });
    const content = resp?.Data?.Choices?.[0]?.Message?.Content || '{}';
    const parsed = JSON.parse(content.replace(/[\s\S]*?(\{[\s\S]*\})[\s\S]*/, '$1'));
    return { score: Math.min(100, Math.max(0, parsed.score || 0)), comment: parsed.comment || '' };
  } catch (e) {
    console.warn('[callHunyuanScore]', e);
    return { score: 50, comment: '评分服务暂时不可用' };
  }
}

module.exports = {
  sentenceScore,
};
