/**
 * 结算场景：Canvas 绘制分数展示和操作按钮
 */

var constants = require('../engine/constants')
var inkStyle = require('../engine/inkStyle')

var THEME = constants.THEME
var GAME_NAMES = constants.GAME_NAMES

var roundRect = inkStyle.roundRect
var drawInkBg = inkStyle.drawInkBg
var drawCloud = inkStyle.drawCloud
var drawDivider = inkStyle.drawDivider
var drawNavBar = inkStyle.drawNavBar

var _mgr = null
var _gameId = ''
var _level = 1
var _success = false
var _score = 0
var _remaining = 0
var _total = 0

var _mainBtnBounds = null
var _homeBtnBounds = null
var _backBtnBounds = null
var _capsuleTop = 0
var _capsuleBottom = 0

var ResultScene = {
  onEnter: function (params, mgr) {
    _mgr = mgr
    _capsuleTop = mgr.capsuleTop || 0
    _capsuleBottom = mgr.capsuleBottom || 0
    _gameId = params.gameId || ''
    _level = parseInt(params.level, 10) || 1
    _success = !!params.success
    _score = parseInt(params.score, 10) || 0
    _remaining = parseInt(params.remaining, 10) || 0
    _total = parseInt(params.total, 10) || 0
    _mainBtnBounds = null
    _homeBtnBounds = null
    _backBtnBounds = null
  },

  onLeave: function () {
    _mainBtnBounds = null
    _homeBtnBounds = null
    _backBtnBounds = null
  },

  draw: function (ctx, w, h) {
    drawInkBg(ctx, w, h)

    var navResult = drawNavBar(ctx, w, _capsuleTop, _capsuleBottom, { title: '游戏结果' })
    _backBtnBounds = navResult.backBtnBounds

    drawCloud(ctx, w * 0.10, h * 0.22, 1.2, 'rgba(200, 37, 6, 0.05)')
    drawCloud(ctx, w * 0.88, h * 0.18, 1.0, 'rgba(30, 111, 159, 0.05)')

    var gameName = GAME_NAMES[_gameId] || '游戏'
    
    var resultText = _success ? '恭喜过关！' : (_remaining <= 0 && _total > 0 ? '时间到！' : '再接再厉')
    var timeText = ''
    if (_total > 0) {
      var used = _total - _remaining
      timeText = _success
        ? '用时 ' + used + '秒（剩余' + _remaining + '秒）'
        : '时间到！共 ' + _total + '秒'
    }

    var padX = 24
    var cardW = w - padX * 2
    var hasTime = !!timeText
    var cardH = hasTime ? 290 : 260
    var mainBtnH = 50
    var mainBtnW = cardW
    var gapCardBtn = 28
    var gapBtnLink = 24
    var linkH = 28
    var totalContentH = cardH + gapCardBtn + mainBtnH + gapBtnLink + linkH
    var availTop = navResult.barBottom
    var availH = h - availTop
    var cardY = availTop + (availH - totalContentH) * 0.3
    var cardX = padX
    var centerX = w / 2

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 6
    roundRect(ctx, cardX, cardY, cardW, cardH, 18)
    ctx.fillStyle = '#FFFAF3'
    ctx.fill()
    ctx.restore()

    roundRect(ctx, cardX, cardY, cardW, cardH, 18)
    ctx.strokeStyle = 'rgba(212, 168, 75, 0.35)'
    ctx.lineWidth = 1
    ctx.stroke()

    if (_success) {
      ctx.save()
      ctx.font = '36px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🎉', centerX, cardY + 38)
      ctx.restore()
    }

    var titleY = cardY + (_success ? 80 : 40)
    ctx.save()
    ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = _success ? THEME.zhuSha : THEME.moHei
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(resultText, centerX, titleY)
    ctx.restore()

    drawDivider(ctx, cardX + cardW * 0.12, titleY + 22, cardW * 0.76)

    ctx.save()
    ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = THEME.nuanHui
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(gameName + '  ·  第' + _level + '关', centerX, titleY + 42)
    ctx.restore()

    ctx.save()
    ctx.font = 'bold 56px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = _success ? THEME.zhuSha : THEME.moHei
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(_score), centerX, titleY + 96)
    ctx.restore()

    ctx.save()
    ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = THEME.nuanHui
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('得分', centerX, titleY + 128)
    ctx.restore()

    if (timeText) {
      ctx.save()
      ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
      var tw = ctx.measureText(timeText).width
      var tpw = tw + 28
      var tpx = (w - tpw) / 2
      var tpy = titleY + 148
      roundRect(ctx, tpx, tpy, tpw, 26, 13)
      ctx.fillStyle = 'rgba(212, 168, 75, 0.08)'
      ctx.fill()
      ctx.fillStyle = THEME.nuanHui
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(timeText, centerX, tpy + 13)
      ctx.restore()
    }

    var btnAreaY = cardY + cardH + gapCardBtn
    var mainBtnX = padX

    ctx.save()
    ctx.shadowColor = 'rgba(200, 37, 6, 0.3)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 4
    roundRect(ctx, mainBtnX, btnAreaY, mainBtnW, mainBtnH, mainBtnH / 2)
    var gradient = ctx.createLinearGradient(mainBtnX, btnAreaY, mainBtnX, btnAreaY + mainBtnH)
    gradient.addColorStop(0, '#D93A1B')
    gradient.addColorStop(0.5, '#C82506')
    gradient.addColorStop(1, '#8B1A04')
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.font = 'bold 17px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(_success ? '下一关' : '再试一次', centerX, btnAreaY + mainBtnH / 2)
    ctx.restore()

    _mainBtnBounds = { x: mainBtnX, y: btnAreaY, w: mainBtnW, h: mainBtnH }

    var homeLinkY = btnAreaY + mainBtnH + gapBtnLink
    ctx.save()
    ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = THEME.nuanHui
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('返回首页', centerX, homeLinkY)
    ctx.restore()

    _homeBtnBounds = { x: centerX - 50, y: homeLinkY - 16, w: 100, h: 32 }
  },

  onTouchEnd: function (touch, mgr) {
    var x = touch.x
    var y = touch.y

    if (_backBtnBounds) {
      var bb = _backBtnBounds
      if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
        mgr.switchTo('home')
        return
      }
    }

    if (_mainBtnBounds) {
      var b = _mainBtnBounds
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        var nextLevel = _success ? _level + 1 : 1
        mgr.switchTo('game', { gameId: _gameId, level: nextLevel, autoStart: true })
        return
      }
    }

    if (_homeBtnBounds) {
      var h = _homeBtnBounds
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        mgr.switchTo('home')
        return
      }
    }
  },
}

module.exports = ResultScene
