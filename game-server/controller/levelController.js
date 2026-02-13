/**
 * 关卡/主题数据：生成与查询
 * @file server-node/controller/levelController.js
 */

const levelModel = require('../model/levelModel');

/**
 * GET /api/level/getLevelData
 * 查询参数：gameId, difficulty, level, openid, themeId?, resetProgress?
 */
async function getLevelData(req, res) {
  const gameId = req.query.gameId;
  const difficulty = req.query.difficulty || ''; // 空字符串表示自动选择
  const level = parseInt(req.query.level, 10) || 0;
  const openid = req.query.openid || 'guest';
  const themeId = req.query.themeId;
  // 支持 'true' / '1' / 1 三种格式
  const resetProgress = req.query.resetProgress === 'true' || req.query.resetProgress === '1' || req.query.resetProgress === 1;
  
  if (!gameId) {
    return res.status(400).json({ code: 400, msg: '缺少 gameId' });
  }
  
  try {
    const data = await levelModel.getLevelData(gameId, difficulty, level, openid, themeId, resetProgress);
    if (!data) {
      return res.json({ levelData: {}, answer: '', difficulty: 'normal' });
    }
    res.json({
      levelData: data.levelData,
      answer: data.answer,
      themeId: data.themeId,
      difficulty: data.difficulty,  // ✅ 返回实际的难度
      timeLimit: data.timeLimit,    // ✅ 返回时间限制
    });
  } catch (e) {
    console.error('[levelController.getLevelData]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

/**
 * GET /api/level/getThemeData
 * 查询参数：themeId
 */
async function getThemeData(req, res) {
  const themeId = req.query.themeId;
  if (!themeId) {
    return res.status(400).json({ code: 400, msg: '缺少 themeId' });
  }
  try {
    const data = await levelModel.getThemeData(themeId);
    res.json({
      themeData: data.themeData,
      material: data.material,
    });
  } catch (e) {
    console.error('[levelController.getThemeData]', e);
    res.status(500).json({ code: 500, msg: e.message || '服务器错误' });
  }
}

module.exports = {
  getLevelData,
  getThemeData,
};
