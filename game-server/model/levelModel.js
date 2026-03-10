/**
 * 关卡表操作（适配新表结构v2）
 * 说明：每个游戏使用独立的关卡表
 * @file server/model/levelModel.js
 */

const pool = require('./pool');

// 游戏ID到表名的映射
const GAME_TABLE_MAP = {
  'wordFind': 't_level_word_find',
  'charDiff': 't_level_char_diff',
  'poetryConnect': 't_level_poetry_connect',
  // 'numberEliminate': 已移除
};

// 游戏时间配置（硬编码）
const TIME_LIMIT_CONFIG = {
  wordFind: {
    easy: 20,
    normal: 30,
    hard: 40,
  },
  charDiff: {
    easy: 10,
    normal: 20,
    hard: 30,
    hell: 25,
  },
  poetryConnect: {
    easy: 10,
    normal: 20,
    hard: 30,
  },
};

/**
 * 根据游戏ID和难度获取时间限制
 * @param {string} gameId - 游戏ID
 * @param {string} difficulty - 难度
 * @returns {number|null} 时间限制（秒）
 */
function getTimeLimit(gameId, difficulty) {
  if (TIME_LIMIT_CONFIG[gameId] && TIME_LIMIT_CONFIG[gameId][difficulty]) {
    return TIME_LIMIT_CONFIG[gameId][difficulty];
  }
  console.warn(`[levelModel] 未找到时间配置：gameId=${gameId}, difficulty=${difficulty}`);
  return null;
}

/**
 * 获取关卡数据（简化版，不使用历史记录）
 * @param {string} gameId - 游戏ID
 * @param {string} difficulty - 难度（由前端根据关卡数计算）
 * @param {number} level - 关卡序号（前端传递）
 * @param {string} openid - 用户 openid（预留，当前未使用）
 * @param {string} [themeId] - 主题ID（预留，仅 charDiff 支持）
 * @param {boolean} [resetProgress] - 是否重置进度（已废弃，保留参数兼容性）
 * @returns {Promise<Object|null>}
 */
async function getLevelData(gameId, difficulty, level, openid, themeId, resetProgress = false) {
  const tableName = GAME_TABLE_MAP[gameId];
  if (!tableName) {
    console.error(`[levelModel] 未知游戏ID: ${gameId}`);
    return null;
  }

  // 验证难度参数
  if (!difficulty) {
    console.error(`[levelModel] 缺少 difficulty 参数`);
    return null;
  }

  // 特殊处理：charDiff 的 hell 难度读取 hard 难度数据
  let queryDifficulty = difficulty;
  if (gameId === 'charDiff' && difficulty === 'hell') {
    queryDifficulty = 'hard';
    console.log(`[levelModel] charDiff hell 难度，使用 hard 难度数据`);
  }

  console.log(`[levelModel] 📊 查询关卡：game=${gameId}, difficulty=${difficulty}, queryDifficulty=${queryDifficulty}, level=${level}, themeId=${themeId || 'null'}`);

  // 构建 SQL：从对应游戏的表中查询
  // charDiff 表没有 difficulty 列，难度由前端游戏逻辑（矩阵大小、时间）控制
  let sql = `SELECT * FROM ${tableName}`;
  const params = [];

  if (gameId !== 'charDiff') {
    sql += ' WHERE difficulty = ?';
    params.push(queryDifficulty);
  }
  
  sql += ' ORDER BY RAND() LIMIT 1';
  
  try {
    const [rows] = await pool.query(sql, params);
    
    // 如果没有找到关卡数据
    if (!rows || rows.length === 0) {
      console.error(`[levelModel] ❌ 没有找到关卡数据：difficulty=${difficulty}`);
      return null;
    }
    
    const row = rows[0];
    console.log(`[levelModel] ✅ 选中关卡：ID=${row.id}, 难度=${difficulty}, level=${level}`);
    
    return parseLevelRow(row, gameId, difficulty);
  } catch (e) {
    console.error(`[levelModel] ❌ 查询关卡数据失败：`, {
      gameId,
      difficulty,
      level,
      error: e.message,
      code: e.code,
      sqlMessage: e.sqlMessage
    });
    throw e;
  }
}

/**
 * 解析关卡行数据
 * @param {Object} row - 数据库行
 * @param {string} gameId - 游戏ID
 * @param {string} difficulty - 难度
 */
function parseLevelRow(row, gameId, difficulty) {
  let level_data = {};
  let answer = null;
  
  // wordFind 使用 answer 字段
  if (gameId === 'wordFind') {
    answer = row.answer;
  } 
  // charDiff: 如果有 same_char 和 diff_char 字段，转换为前端需要的格式
  else if (gameId === 'charDiff') {
    if (row.same_char && row.diff_char) {
      level_data = {
        base: row.same_char,
        diff: row.diff_char,
      };
      console.log(`[levelModel] charDiff 数据转换：same_char=${row.same_char}, diff_char=${row.diff_char}`);
    } else if (row.level_data) {
      // 兼容：如果 level_data 字段有数据，也使用它
      try {
        level_data = typeof row.level_data === 'string'
          ? JSON.parse(row.level_data)
          : row.level_data;
      } catch (e) {
        console.error('[levelModel] level_data 解析失败', e);
      }
    }
  }
  // poetryConnect 和其他游戏使用 level_data JSON 字段
  else {
    try {
      if (row.level_data) {
        // mysql2 对 JSON 列可能已自动解析为对象，也可能返回字符串
        level_data = typeof row.level_data === 'string'
          ? JSON.parse(row.level_data)
          : row.level_data;
      }
    } catch (e) {
      console.error('[levelModel] level_data 解析失败', e);
    }
  }
  
  return {
    levelData: level_data,
    answer: answer,
    themeId: row.theme_id || null,
    difficulty: difficulty,  // ✅ 返回实际的难度
    timeLimit: getTimeLimit(gameId, difficulty),  // ✅ 从配置中获取时间限制
  };
}

/**
 * 从 t_level_char_diff 表中随机获取一条汉字找不同数据（不区分难度）
 * @returns {Promise<{id: number, sameChar: string, diffChar: string} | null>}
 */
async function getRandomCharDiff() {
  const sql = 'SELECT id, same_char, diff_char FROM t_level_char_diff ORDER BY RAND() LIMIT 1';
  try {
    const [rows] = await pool.query(sql);
    if (!rows || rows.length === 0) {
      return null;
    }
    const row = rows[0];
    return {
      id: row.id,
      sameChar: row.same_char,
      diffChar: row.diff_char,
    };
  } catch (e) {
    console.error('[levelModel] getRandomCharDiff 查询失败:', e.message);
    throw e;
  }
}

module.exports = {
  getLevelData,
  getRandomCharDiff,
};
