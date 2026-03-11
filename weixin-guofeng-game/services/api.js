/**
 * 后端业务接口定义
 */

var req = require('./request')
var get = req.get
var post = req.post

function wxLogin(code, nickname, avatarUrl) {
  return post('/api/user/wxLogin', { code: code, nickname: nickname, avatarUrl: avatarUrl })
}

function userInit(openid, nickname) {
  return post('/api/user/init', { openid: openid, nickname: nickname })
}

function saveProgress(openid, gameId, level) {
  return post('/api/user/saveProgress', { openid: openid, gameId: gameId, level: level })
}

function unlockGame(openid, gameId, type) {
  return post('/api/user/unlockGame', { openid: openid, gameId: gameId, type: type })
}

function getLevelData(gameId, difficulty, level, openid, themeId, resetProgress) {
  return get('/api/level/getLevelData', {
    gameId: gameId,
    difficulty: difficulty,
    level: level,
    openid: openid,
    themeId: themeId,
    resetProgress: resetProgress ? '1' : '0',
  })
}

function getThemeData(themeId) {
  return get('/api/level/getThemeData', { themeId: themeId })
}

function shareSuccess(openid, gameId) {
  return post('/api/user/shareSuccess', { openid: openid, gameId: gameId })
}

module.exports = {
  wxLogin: wxLogin,
  userInit: userInit,
  saveProgress: saveProgress,
  unlockGame: unlockGame,
  getLevelData: getLevelData,
  getThemeData: getThemeData,
  shareSuccess: shareSuccess,
}
