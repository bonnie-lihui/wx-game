/**
 * 首页场景：Canvas 绘制 3 张游戏卡片
 */

var constants = require('../engine/constants')
var inkStyle = require('../engine/inkStyle')
var sound = require('../utils/sound')

var THEME = constants.THEME
var GAME_NAMES = constants.GAME_NAMES
var roundRect = inkStyle.roundRect
var drawInkBg = inkStyle.drawInkBg
var drawCloud = inkStyle.drawCloud
var drawFlower = inkStyle.drawFlower
var drawDivider = inkStyle.drawDivider
var drawGameIcon = inkStyle.drawGameIcon

var games = [
  { id: 'wordFind',      name: GAME_NAMES.wordFind,      desc: '字阵寻宝', colors: ['#FFF5F0', '#FFE8DC'], iconBg: 'rgba(200, 37, 6, 0.10)' },
  { id: 'charDiff',      name: GAME_NAMES.charDiff,      desc: '火眼金睛', colors: ['#FFF8EE', '#FFECD2'], iconBg: 'rgba(30, 111, 159, 0.10)' },
  { id: 'poetryConnect', name: GAME_NAMES.poetryConnect,  desc: '对句成诗', colors: ['#F0F7FF', '#DCE8F5'], iconBg: 'rgba(212, 168, 75, 0.12)' },
]

var _cardBounds = []
var _mgr = null
var _capsuleTop = 0
var _capsuleBottom = 0

var HomeScene = {
  onEnter: function (params, mgr) {
    _mgr = mgr
    _capsuleTop = mgr.capsuleTop || 0
    _capsuleBottom = mgr.capsuleBottom || 0
    _cardBounds = []
  },

  onLeave: function () {
    _cardBounds = []
  },

  draw: function (ctx, w, h) {
    drawInkBg(ctx, w, h)

    drawFlower(ctx, w * 0.88, h * 0.06, 18, '#E8744B', 0.15)
    drawFlower(ctx, w * 0.10, h * 0.88, 20, '#D4A84B', 0.15)
    drawCloud(ctx, w * 0.85, h * 0.92, 1.5, 'rgba(30, 111, 159, 0.06)')

    var capsuleCenterY = (_capsuleTop + _capsuleBottom) / 2
    ctx.save()
    ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", serif'
    ctx.fillStyle = '#2C1810'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('国风益智集', w / 2, capsuleCenterY)
    ctx.restore()

    var subtitleY = _capsuleBottom + 14
    ctx.save()
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#8B6F47'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('— 经典国风益智小游戏 —', w / 2, subtitleY)
    ctx.restore()

    drawDivider(ctx, w * 0.2, subtitleY + 14, w * 0.6)

    var padX = 20
    var cardW = w - padX * 2
    var cardH = 96
    var gap = 16
    var cardStartY = subtitleY + 36

    _cardBounds = []

    for (var i = 0; i < games.length; i++) {
      var game = games[i]
      var cx = padX
      var cy = cardStartY + i * (cardH + gap)

      ctx.save()
      ctx.shadowColor = 'rgba(139, 111, 71, 0.12)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetY = 3
      roundRect(ctx, cx, cy, cardW, cardH, 16)
      var grad = ctx.createLinearGradient(cx, cy, cx + cardW, cy)
      grad.addColorStop(0, game.colors[0])
      grad.addColorStop(1, game.colors[1])
      ctx.fillStyle = grad
      ctx.fill()
      ctx.restore()

      roundRect(ctx, cx, cy, cardW, cardH, 16)
      ctx.strokeStyle = 'rgba(212, 168, 75, 0.18)'
      ctx.lineWidth = 1
      ctx.stroke()

      var iconCx = cx + 52
      var iconCy = cy + cardH / 2
      var iconR = 28
      ctx.save()
      ctx.beginPath()
      ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
      ctx.fillStyle = game.iconBg
      ctx.fill()
      ctx.restore()

      drawGameIcon(ctx, iconCx, iconCy, iconR * 1.5, game.id)

      var textX = cx + 96
      ctx.save()
      ctx.font = 'bold 17px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = '#2C1810'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(game.name, textX, cy + cardH * 0.38)
      ctx.restore()

      ctx.save()
      ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = '#A0937E'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(game.desc, textX, cy + cardH * 0.62)
      ctx.restore()

      var arrowX = cx + cardW - 24
      var arrowY = cy + cardH / 2
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(arrowX - 4, arrowY - 6)
      ctx.lineTo(arrowX + 2, arrowY)
      ctx.lineTo(arrowX - 4, arrowY + 6)
      ctx.strokeStyle = 'rgba(139, 111, 71, 0.3)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.restore()

      _cardBounds.push({
        x: cx,
        y: cy,
        w: cardW,
        h: cardH,
        gameId: game.id,
      })
    }

    ctx.save()
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#B8A48C'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('点击卡片开始游戏', w / 2, h - 50)
    ctx.restore()
  },

  onTouchEnd: function (touch, mgr) {
    var x = touch.x
    var y = touch.y
    for (var i = 0; i < _cardBounds.length; i++) {
      var b = _cardBounds[i]
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        sound.tap()
        mgr.switchTo('game', { gameId: b.gameId, level: 1 })
        return
      }
    }
  },
}

module.exports = HomeScene
