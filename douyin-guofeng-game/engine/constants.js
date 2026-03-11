/**
 * 国风主题常量：色彩、尺寸、字体
 *
 * 所有 Canvas 绘制统一从此处引用颜色和尺寸，
 * 后续主题切换只需替换此文件的导出值。
 */

const THEME = {
  zhuSha: '#C82506',
  miHuang: '#F5E9D6',
  moHei: '#232323',
  qingLan: '#1E6F9F',
  danJin: '#D4A84B',
  anHong: '#8B1A04',
  qianMi: '#FFF8EE',
  nuanHui: '#B8A48C',
}

const FONT_FAMILY = '"PingFang SC", "Microsoft YaHei", sans-serif'

const GAME_NAMES = {
  wordFind: '国风找成语',
  charDiff: '汉字找不同',
  poetryConnect: '诗词连线',
}

const GAME_ICONS = {
  wordFind: '文',
  charDiff: '辨',
  poetryConnect: '诗',
}

const TIME_CONFIG = {
  wordFind: { easy: 20, normal: 30, hard: 40 },
  charDiff: { easy: 5, normal: 10, hard: 15, hell: 20 },
  poetryConnect: { easy: 30, normal: 45, hard: 70 },
}

function getDifficulty(level) {
  if (level >= 1 && level <= 3) return 'easy'
  if (level >= 4 && level <= 6) return 'normal'
  if (level >= 7 && level <= 10) return 'hard'
  return 'hell'
}

function getTimeLimit(gameId, difficulty) {
  const cfg = TIME_CONFIG[gameId]
  if (!cfg) return 30
  if (difficulty === 'hell' && cfg.hell) return cfg.hell
  return cfg[difficulty] || cfg.normal || 30
}

module.exports = {
  THEME,
  FONT_FAMILY,
  GAME_NAMES,
  GAME_ICONS,
  TIME_CONFIG,
  getDifficulty,
  getTimeLimit,
}
