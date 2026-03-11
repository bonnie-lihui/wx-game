/**
 * 游戏场景：Canvas 游戏主逻辑
 */

var constants = require('../engine/constants')
var inkStyle = require('../engine/inkStyle')
var api = require('../services/api')
var auth = require('../utils/auth')
var WordFindLogic = require('../gameLogic/wordFind').WordFindLogic
var CharDiffLogic = require('../gameLogic/charDiff').CharDiffLogic
var PoetryConnectLogic = require('../gameLogic/poetryConnect').PoetryConnectLogic

var THEME = constants.THEME
var GAME_NAMES = constants.GAME_NAMES

var getDifficulty = constants.getDifficulty
var getTimeLimit = constants.getTimeLimit
var roundRect = inkStyle.roundRect
var drawInkBg = inkStyle.drawInkBg
var drawDivider = inkStyle.drawDivider
var drawNavBar = inkStyle.drawNavBar

var _mgr = null
var _gameId = ''
var _level = 1
var _logic = null
var _dataReady = false
var _gameState = 'ready'
var _hintCount = 1
var _hintIndexUsed = 0
var _levelData = null
var _answer = ''
var _difficulty = 'easy'
var _customTimeLimit = null
var _autoStart = false
var _resetProgress = false

var _timerRemaining = 0
var _timerTotal = 0
var _timerRunning = false
var _timerStartTime = 0
var _timerPausedRemaining = 0
var _lastDrawnSec = 0

var _hintBtnBounds = null
var _startBtnBounds = null
var _backBtnBounds = null
var _capsuleTop = 0
var _capsuleBottom = 0

function _resetState() {
  _logic = null
  _dataReady = false
  _gameState = 'ready'
  _hintCount = 1
  _hintIndexUsed = 0
  _levelData = null
  _answer = ''
  _difficulty = 'easy'
  _customTimeLimit = null
  _autoStart = false
  _resetProgress = false
  _timerRemaining = 0
  _timerTotal = 0
  _timerRunning = false
  _timerStartTime = 0
  _timerPausedRemaining = 0
  _lastDrawnSec = 0
  _hintBtnBounds = null
  _startBtnBounds = null
  _backBtnBounds = null
}

function _startTimer() {
  _hintCount = 1
  _hintIndexUsed = 0
  var totalSec = _customTimeLimit || getTimeLimit(_gameId, _difficulty)
  _timerTotal = totalSec
  _timerRemaining = totalSec
  _timerRunning = true
  _timerStartTime = Date.now()
  _timerPausedRemaining = totalSec
  _lastDrawnSec = totalSec
}

function _updateTimer() {
  if (!_timerRunning || _timerTotal <= 0) return
  var elapsed = (Date.now() - _timerStartTime) / 1000
  _timerRemaining = Math.max(0, _timerPausedRemaining - elapsed)

  if (_timerRemaining <= 0) {
    _timerRemaining = 0
    _timerRunning = false
    _mgr.requestDraw()
    setTimeout(function () { _goResult(false) }, 100)
  }
}

function _screenToLocal(x, y, offsetX, offsetY, scale) {
  return {
    localX: (x - offsetX) / scale,
    localY: (y - offsetY) / scale,
  }
}

function _createLogic() {
  var data = _levelData || {}
  switch (_gameId) {
    case 'wordFind':
      _logic = new WordFindLogic({ answer: _answer || '国泰民安', difficulty: _difficulty })
      break
    case 'charDiff':
      _logic = new CharDiffLogic({
        matrix: data.matrix,
        diffAt: data.diffAt || (data.diffRow != null ? { row: data.diffRow, col: data.diffCol } : undefined),
        base: data.base,
        diff: data.diff,
        difficulty: _difficulty,
      })
      break
    case 'poetryConnect':
      _logic = new PoetryConnectLogic({
        items: data.items,
        pairs: data.pairs,
        difficulty: _difficulty,
      })
      break
    default:
      _logic = new WordFindLogic({ answer: _answer || '国泰民安' })
  }
}

function _loadLevelAndStart() {
  var diff = getDifficulty(_level)
  _difficulty = diff

  api.getLevelData(_gameId, diff, _level, auth.getOpenid(), null, _resetProgress)
    .then(function (res) {
      _levelData = res.levelData || {}
      _answer = res.answer || ''
      _difficulty = res.difficulty || diff

      if (res.timeLimit) {
        _customTimeLimit = res.timeLimit
      }

      var totalSec = _customTimeLimit || getTimeLimit(_gameId, _difficulty)
      _timerTotal = totalSec
      _timerRemaining = totalSec

      _dataReady = true
      _createLogic()

      if (_autoStart) {
        _gameState = 'playing'
        _startTimer()
      }

      _mgr.requestDraw()
    })
    .catch(function (err) {
      console.error('[GameScene] 接口失败', err)
      _mgr.showModal({
        title: '加载失败',
        content: '无法获取关卡数据，请检查网络连接后重试',
        confirmText: '重试',
        onConfirm: function () {
          _loadLevelAndStart()
        },
      })
    })
}

function _getScoringRules() {
  switch (_gameId) {
    case 'wordFind':
      return ['• 基础分：100分', '• 时间奖励：剩余时间 × 1.2分', '• 耗时惩罚：已用时间 × 1.0分', '• 错误惩罚：每次错误 -8分', '• 策略：快速且准确']
    case 'charDiff':
      return ['• 基础分：100分', '• 耗时惩罚：已用时间 × 1.5分', '• 错误惩罚：每次错误 -12分', '• 策略：快速观察，精准点击', '• 90-100分 ⭐⭐⭐ | 60-79分 ⭐']
    case 'poetryConnect':
      return ['• 基础分：100分', '• 耗时惩罚：已用时间 × 0.6分', '• 错误惩罚：每次错误连线 -10分', '• 策略：平衡速度与准确度', '• 90-100分 ⭐⭐⭐ | 60-79分 ⭐']
    default:
      return ['• 基础分：100分', '• 完成游戏即可获得分数']
  }
}

function _getGameNativeSize() {
  var lg = _logic
  var nativeW = 390, nativeH = 312
  if (!lg) return { nativeW: nativeW, nativeH: nativeH }

  if (_gameId === 'wordFind' && lg.cols) {
    nativeW = lg.cols * (lg.cellSize + 6) - 6
    nativeH = lg.rows * (lg.cellSize + 6) - 6
  } else if (_gameId === 'charDiff' && lg.cols) {
    nativeW = lg.cols * (lg.cellSize + 4) - 4
    nativeH = lg.rows * (lg.cellSize + 4) - 4
  } else if (_gameId === 'poetryConnect' && lg._colW) {
    nativeW = lg._colW * 2 + 24
    var uc = 0
    for (var i = 0; i < (lg.items || []).length; i++) {
      if (lg.items[i].type === 'upper') uc++
    }
    nativeH = uc * (lg._itemH + (lg._itemGap || 8)) - (lg._itemGap || 8)
  }
  return { nativeW: nativeW, nativeH: nativeH }
}

function _drawReadyScreen(ctx, w, h, titleBarH) {
  var startY = titleBarH + 60
  var rules = _getScoringRules()
  var cardW = w - 48, cardX = 24, cardY = startY, cardH = 200

  ctx.save()
  roundRect(ctx, cardX, cardY, cardW, cardH, 12)
  ctx.fillStyle = 'rgba(255, 251, 245, 0.95)'
  ctx.fill()
  ctx.strokeStyle = THEME.danJin
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = THEME.zhuSha
  ctx.textAlign = 'center'
  ctx.fillText('📋 计分规则', w / 2, cardY + 28)

  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = THEME.moHei
  ctx.textAlign = 'left'
  var lineY = cardY + 56
  for (var i = 0; i < rules.length; i++) {
    ctx.fillText(rules[i], cardX + 20, lineY + i * 24)
  }

  var diffText = _difficulty === 'easy' ? '简单' : (_difficulty === 'normal' ? '一般' : '困难')
  ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = THEME.nuanHui
  ctx.textAlign = 'center'
  ctx.fillText('当前难度：' + diffText + '  |  时限：' + _timerTotal + '秒', w / 2, cardY + cardH - 16)
  ctx.restore()

  var btnW = 200, btnH = 50
  var btnX = (w - btnW) / 2, btnY = cardY + cardH + 40

  ctx.save()
  ctx.shadowColor = 'rgba(200, 37, 6, 0.3)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  roundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2)
  var gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
  gradient.addColorStop(0, '#E63322')
  gradient.addColorStop(1, THEME.zhuSha)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#FFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🎮 开始游戏', w / 2, btnY + btnH / 2)
  ctx.restore()

  _startBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH }
}

function _goResult(success) {
  _gameState = 'finished'
  _timerRunning = false
  var remaining = _timerRemaining || 0
  var total = _timerTotal || 0
  var score = 0
  if (success && _logic && typeof _logic.calcFinalScore === 'function') {
    score = _logic.calcFinalScore(remaining, total)
  }
  _mgr.switchTo('result', {
    gameId: _gameId,
    level: _level,
    success: success,
    score: score,
    remaining: Math.floor(remaining),
    total: total,
  })
}

function _provideHint() {
  var idx = _hintIndexUsed
  var hintText = ''

  if (_gameId === 'wordFind' && _answer.length >= 4) {
    if (idx === 0) hintText = '成语的第一个字是"' + _answer[0] + '"'
    else if (idx === 1) hintText = '前两个字是"' + _answer[0] + _answer[1] + '"'
    else if (idx === 2) hintText = '最后一个字是"' + _answer[3] + '"'
  } else if (_gameId === 'charDiff' && _logic && _logic.diffAt) {
    var row = _logic.diffAt.row + 1, col = _logic.diffAt.col + 1
    if (idx === 0) hintText = '不同的字在第 ' + row + ' 行附近'
    else if (idx === 1) hintText = '在第 ' + col + ' 列附近'
    else hintText = '在第 ' + row + ' 行第 ' + col + ' 列'
  } else if (_gameId === 'poetryConnect') {
    hintText = '仔细回忆诗词的上下句对应关系'
  }

  if (!hintText) {
    hintText = '本关暂无更多提示，加油！'
    _hintCount++
  } else {
    _hintIndexUsed++
  }

  _mgr.showModal({
    title: '💡 提示',
    content: hintText,
    confirmText: '知道了',
  })
}

function _showHint() {
  if (_hintCount > 0) {
    _hintCount--
    _provideHint()
    return
  }
  _mgr.showToast('暂无更多提示', 1500)
}

function _handleGameTap(x, y, w, h) {
  var titleBarH = _capsuleBottom + 10 + 24
  var areaTop = titleBarH + 28
  var availW = w - 24
  var lg = _logic
  if (!lg) return

  var size = _getGameNativeSize()
  var nativeW = size.nativeW, nativeH = size.nativeH
  var extraTop = _gameId === 'wordFind' ? 50 : (_gameId === 'charDiff' || _gameId === 'poetryConnect' ? 40 : 24)
  var maxH = h - areaTop - 80
  var sc = Math.min(availW / nativeW, maxH / (nativeH + extraTop), 1.15)
  var offsetX = (w - nativeW * sc) / 2
  var offsetY = areaTop + extraTop * sc

  if (_hintBtnBounds) {
    var b = _hintBtnBounds
    if (y >= b.y && y <= b.y + b.h && x >= b.x && x <= b.x + b.w) {
      _showHint()
      return
    }
  }

  var local = _screenToLocal(x, y, offsetX, offsetY, sc)
  var localX = local.localX, localY = local.localY

  if (_gameId === 'wordFind' && lg.getCellByPoint) {
    var cell = lg.getCellByPoint(localX, localY)
    if (cell) {
      var ret = lg.tapCell(cell.row, cell.col)
      _mgr.requestDraw()
      if (ret && ret.isFull) {
        if (ret.isCorrect) { _goResult(true) }
        else {
          _mgr.showToast('答案不对，再试试', 1500)
          setTimeout(function () { lg.selected = []; _mgr.requestDraw() }, 1500)
        }
      }
    }
  } else if (_gameId === 'charDiff' && lg.getCellByPoint) {
    var cell2 = lg.getCellByPoint(localX, localY)
    if (cell2) {
      var ret2 = lg.tap(cell2.row, cell2.col)
      _mgr.requestDraw()
      if (ret2.hit) { _goResult(true) }
      else {
        var tip = ret2.isRepeated ? '这个字已经试过了哦～'
          : ret2.wrongCount <= 2 ? '不对哦～再仔细看看'
          : '可以试试提示按钮哦'
        _mgr.showToast(tip, 1500)
      }
    }
  } else if (_gameId === 'poetryConnect' && lg.getItemByPoint) {
    var item = lg.getItemByPoint(localX, localY)
    if (item) {
      var res = lg.tapItem(item.id)
      _mgr.requestDraw()
      if (res.isComplete) _goResult(true)
    }
  }
}

var GameScene = {
  onEnter: function (params, mgr) {
    _mgr = mgr
    _capsuleTop = mgr.capsuleTop || 0
    _capsuleBottom = mgr.capsuleBottom || 0
    _resetState()
    _gameId = params.gameId || 'wordFind'
    _level = parseInt(params.level, 10) || 1
    _autoStart = !!params.autoStart
    _resetProgress = !!params.reset
    _loadLevelAndStart()
  },

  onLeave: function () {
    _timerRunning = false
  },

  update: function (dt, mgr) {
    _updateTimer()

    if (_timerRunning) {
      var curSec = Math.ceil(_timerRemaining)
      if (curSec !== _lastDrawnSec) {
        _lastDrawnSec = curSec
        mgr.requestDraw()
      }
    }
  },

  draw: function (ctx, w, h) {
    drawInkBg(ctx, w, h)

    var gameName = GAME_NAMES[_gameId] || _gameId
    var navResult = drawNavBar(ctx, w, _capsuleTop, _capsuleBottom, {
      title: gameName,
    })
    var titleBarH = navResult.barBottom
    _backBtnBounds = navResult.backBtnBounds

    var lvText = '第' + _level + '关'
    var diffLabel = _difficulty === 'easy' ? '简单' : (_difficulty === 'normal' ? '一般' : '困难')
    ctx.save()
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = THEME.nuanHui
    ctx.fillText(lvText + '  ·  ' + diffLabel, w / 2, titleBarH + 12)
    ctx.restore()
    titleBarH = titleBarH + 24

    if (_gameState === 'ready') {
      if (_dataReady) {
        _drawReadyScreen(ctx, w, h, titleBarH)
      } else {
        ctx.save()
        ctx.fillStyle = THEME.nuanHui
        ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('加载中...', w / 2, h / 2)
        ctx.restore()
      }
      return
    }

    var timerBarY = titleBarH + 4
    if (_timerRunning && _timerTotal > 0) {
      var pct = Math.max(0, _timerRemaining / _timerTotal)
      var timerColor = pct > 0.5 ? '#4CAF50' : (pct > 0.3 ? '#FF9800' : '#E53935')
      ctx.save()
      roundRect(ctx, 16, timerBarY, w - 32, 6, 3)
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      ctx.fill()
      if (pct > 0) {
        roundRect(ctx, 16, timerBarY, (w - 32) * pct, 6, 3)
        ctx.fillStyle = timerColor
        ctx.fill()
      }
      ctx.font = 'bold 12px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = timerColor
      var secText = Math.ceil(_timerRemaining) + 's'
      if (_timerRemaining <= 5 && _timerRemaining > 0) {
        ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif'
      }
      ctx.fillText(secText, w - 16, timerBarY + 18)
      ctx.restore()
    }

    var areaTop = titleBarH + 28
    var availW = w - 24
    var lg = _logic
    var contentBottomY = areaTop

    if (lg && typeof lg.draw === 'function') {
      var size = _getGameNativeSize()
      var nativeW = size.nativeW, nativeH = size.nativeH
      var extraTop = _gameId === 'wordFind' ? 50 : (_gameId === 'charDiff' || _gameId === 'poetryConnect' ? 40 : 24)
      var totalNativeH = nativeH + extraTop
      var maxH = h - areaTop - 80
      var scale = Math.min(availW / nativeW, maxH / totalNativeH, 1.15)
      var scaledW = nativeW * scale
      var cx = (w - scaledW) / 2
      var cy = areaTop + extraTop * scale
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(scale, scale)
      lg.draw(ctx, 0, 0)
      ctx.restore()
      contentBottomY = cy + nativeH * scale + 16
    } else {
      ctx.save()
      ctx.fillStyle = THEME.nuanHui
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('加载中...', w / 2, h / 2)
      ctx.restore()
      contentBottomY = h / 2 + 30
    }

    var btnH = 44
    var btnMinY = contentBottomY + 8
    var btnMaxY = h - btnH - 16
    var btnY = Math.min(btnMinY, btnMaxY)
    var hintOnlyW = 140
    var hintOnlyX = (w - hintOnlyW) / 2

    ctx.save()
    roundRect(ctx, hintOnlyX, btnY, hintOnlyW, btnH, btnH / 2)
    var hasHint = _hintCount > 0
    ctx.fillStyle = hasHint ? 'rgba(212, 168, 75, 0.12)' : 'rgba(212, 168, 75, 0.08)'
    ctx.fill()
    ctx.strokeStyle = hasHint ? THEME.danJin : '#B8A48C'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = hasHint ? THEME.danJin : '#999'
    ctx.fillText(_hintCount > 0 ? '💡 提示' : '💡 看广告得提示', hintOnlyX + hintOnlyW / 2, btnY + btnH / 2)
    ctx.restore()
    _hintBtnBounds = { x: hintOnlyX, y: btnY, w: hintOnlyW, h: btnH }
  },

  onTouchEnd: function (touch, mgr) {
    var x = touch.x
    var y = touch.y

    if (_backBtnBounds) {
      var bb = _backBtnBounds
      if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
        _timerRunning = false
        mgr.switchTo('home')
        return
      }
    }

    if (_gameState === 'ready' && _startBtnBounds) {
      var btn = _startBtnBounds
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        _gameState = 'playing'
        _startTimer()
        mgr.requestDraw()
        return
      }
    }

    if (_gameState === 'playing') {
      _handleGameTap(x, y, mgr.width, mgr.height)
    }
  },
}

module.exports = GameScene
