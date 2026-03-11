/**
 * 主题玩法包：春节/中秋/儿童启蒙/古风武侠
 * 按主题加载 Canvas 素材与题库，懒加载
 * @file gameLogic/themePackage.js
 */

const THEMES = {
  spring: { id: 'spring', name: '春节', color: '#C82506', icon: 'spring' },
  midAutumn: { id: 'midAutumn', name: '中秋', color: '#1E6F9F', icon: 'moon' },
  child: { id: 'child', name: '儿童启蒙', color: '#2E7D32', icon: 'child' },
  wuxia: { id: 'wuxia', name: '古风武侠', color: '#232323', icon: 'sword' },
};

/** 主题与 gameId 的映射（哪些玩法属于哪一主题） */
const THEME_GAME_MAP = {
  wordFind: ['spring', 'midAutumn'],
  charDiff: ['spring', 'child'],
  poetryConnect: ['spring', 'midAutumn', 'wuxia'],
  // numberEliminate 已移除
};

/**
 * 获取主题列表
 * @returns {Array<{ id: string, name: string, color: string, icon: string }>}
 */
function getThemeList() {
  return Object.values(THEMES);
}

/**
 * 根据 themeId 获取主题配置
 * @param {string} themeId
 */
function getThemeById(themeId) {
  return THEMES[themeId] || null;
}

/**
 * 获取某玩法适用的主题
 * @param {string} gameId
 */
function getThemesForGame(gameId) {
  return THEME_GAME_MAP[gameId] || [];
}

/**
 * 主题包数据加载（调用后端 /api/level/getThemeData）
 * @param {string} themeId
 * @param {Function} apiGetTheme - (themeId) => Promise<{ themeData, material }>
 * @returns {Promise<Object>}
 */
async function loadThemeData(themeId, apiGetTheme) {
  const theme = getThemeById(themeId);
  if (!theme) return { themeData: null, material: null };
  try {
    const res = await apiGetTheme(themeId);
    return { themeData: res.themeData || res, material: res.material || null };
  } catch (e) {
    console.warn('[ThemePackage] loadThemeData fail', themeId, e);
    return { themeData: null, material: null };
  }
}

module.exports = {
  THEMES,
  THEME_GAME_MAP,
  getThemeList,
  getThemeById,
  getThemesForGame,
  loadThemeData,
};
