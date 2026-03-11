/**
 * 场景管理器：管理 home / game / result 三个场景的切换和生命周期
 *
 * 每个场景需实现：onEnter(params) / onLeave() / draw(ctx, w, h) / onTouchEnd(touch)
 * 可选实现：onTouchStart(touch) / onTouchMove(touch) / update(dt)
 */

var homeScene = require('./homeScene')
var gameScene = require('./gameScene')
var resultScene = require('./resultScene')
var sound = require('../utils/sound')

var scenes = {
  home: homeScene,
  game: gameScene,
  result: resultScene,
}

var SceneManager = {
  current: null,
  currentName: '',
  ctx: null,
  width: 0,
  height: 0,
  capsuleTop: 0,
  capsuleBottom: 0,
  _needsDraw: true,
  _toastText: '',
  _toastEndTime: 0,
  _modalConfig: null,
  _modalBtnBounds: null,

  _fadePhase: 'none',
  _fadeAlpha: 0,
  _fadeStartTime: 0,
  _fadeDuration: 220,
  _pendingScene: null,
  _pendingParams: null,

  _musicAngle: 0,
  _bgmActivated: false,

  init: function (ctx, w, h, capsuleTop, capsuleBottom) {
    this.ctx = ctx
    this.width = w
    this.height = h
    this.capsuleTop = capsuleTop || 0
    this.capsuleBottom = capsuleBottom || 0
  },

  _immediateSwitch: function (sceneName, params) {
    if (this.current && this.current.onLeave) {
      this.current.onLeave()
    }
    this.current = scenes[sceneName] || null
    this.currentName = sceneName
    this._needsDraw = true
    this._toastText = ''
    this._modalConfig = null
    if (this.current && this.current.onEnter) {
      this.current.onEnter(params || {}, this)
    }
  },

  switchTo: function (sceneName, params) {
    if (!this.current) {
      this._immediateSwitch(sceneName, params)
      return
    }
    if (this._fadePhase !== 'none') return

    this._pendingScene = sceneName
    this._pendingParams = params || {}
    this._fadePhase = 'out'
    this._fadeStartTime = Date.now()
    this._fadeAlpha = 0
    this._needsDraw = true
  },

  requestDraw: function () {
    this._needsDraw = true
  },

  showToast: function (text, duration) {
    this._toastText = text
    this._toastEndTime = Date.now() + (duration || 1500)
    this._needsDraw = true
  },

  showModal: function (config) {
    this._modalConfig = config
    this._needsDraw = true
  },

  hideModal: function () {
    this._modalConfig = null
    this._modalBtnBounds = null
    this._needsDraw = true
  },

  draw: function () {
    var ctx = this.ctx
    var w = this.width
    var h = this.height
    if (!ctx) return

    if (this.current && this.current.draw) {
      this.current.draw(ctx, w, h)
    }

    if (this.currentName === 'home') {
      this._drawMusicBtn(ctx, w, h)
    }

    if (this._toastText && Date.now() < this._toastEndTime) {
      this._drawToast(ctx, w, h)
    } else if (this._toastText) {
      this._toastText = ''
      this._needsDraw = true
    }

    if (this._modalConfig) {
      this._drawModal(ctx, w, h)
    }

    if (this._fadeAlpha > 0) {
      ctx.save()
      ctx.fillStyle = 'rgba(245, 233, 214, ' + this._fadeAlpha.toFixed(3) + ')'
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
  },

  _drawToast: function (ctx, w, h) {
    var text = this._toastText
    ctx.save()
    ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
    var tw = ctx.measureText(text).width
    var pw = tw + 32
    var ph = 36
    var px = (w - pw) / 2
    var py = h * 0.75

    ctx.fillStyle = 'rgba(35, 35, 35, 0.8)'
    ctx.beginPath()
    var r = 8
    ctx.moveTo(px + r, py)
    ctx.lineTo(px + pw - r, py)
    ctx.arcTo(px + pw, py, px + pw, py + r, r)
    ctx.lineTo(px + pw, py + ph - r)
    ctx.arcTo(px + pw, py + ph, px + pw - r, py + ph, r)
    ctx.lineTo(px + r, py + ph)
    ctx.arcTo(px, py + ph, px, py + ph - r, r)
    ctx.lineTo(px, py + r)
    ctx.arcTo(px, py, px + r, py, r)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, py + ph / 2)
    ctx.restore()
  },

  _drawModal: function (ctx, w, h) {
    var cfg = this._modalConfig
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, 0, w, h)

    var mw = w * 0.75
    var mh = 200
    var mx = (w - mw) / 2
    var my = (h - mh) / 2
    var r = 16

    ctx.fillStyle = '#FFFBF5'
    ctx.beginPath()
    ctx.moveTo(mx + r, my)
    ctx.lineTo(mx + mw - r, my)
    ctx.arcTo(mx + mw, my, mx + mw, my + r, r)
    ctx.lineTo(mx + mw, my + mh - r)
    ctx.arcTo(mx + mw, my + mh, mx + mw - r, my + mh, r)
    ctx.lineTo(mx + r, my + mh)
    ctx.arcTo(mx, my + mh, mx, my + mh - r, r)
    ctx.lineTo(mx, my + r)
    ctx.arcTo(mx, my, mx + r, my, r)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#D4A84B'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#232323'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(cfg.title || '提示', w / 2, my + 36)

    ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#666666'
    var content = cfg.content || ''
    var maxLineW = mw - 40
    var lines = this._wrapText(ctx, content, maxLineW)
    var lineY = my + 70
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], w / 2, lineY + i * 22)
    }

    var btnW = 120
    var btnH = 38
    var btnX = (w - btnW) / 2
    var btnY = my + mh - 52

    ctx.fillStyle = '#C82506'
    ctx.beginPath()
    ctx.moveTo(btnX + btnH / 2, btnY)
    ctx.lineTo(btnX + btnW - btnH / 2, btnY)
    ctx.arc(btnX + btnW - btnH / 2, btnY + btnH / 2, btnH / 2, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(btnX + btnH / 2, btnY + btnH)
    ctx.arc(btnX + btnH / 2, btnY + btnH / 2, btnH / 2, Math.PI / 2, -Math.PI / 2)
    ctx.closePath()
    ctx.fill()

    ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(cfg.confirmText || '确定', w / 2, btnY + btnH / 2)

    this._modalBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH }
    ctx.restore()
  },

  _drawMusicBtn: function (ctx, w, h) {
    var cx = w - 34
    var cy = h - 54
    var bgR = 20
    var playing = sound.isBgmPlaying()

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, bgR, 0, Math.PI * 2)
    ctx.fillStyle = playing ? 'rgba(212, 168, 75, 0.10)' : 'rgba(160, 147, 126, 0.08)'
    ctx.fill()
    ctx.strokeStyle = playing ? 'rgba(212, 168, 75, 0.25)' : 'rgba(160, 147, 126, 0.18)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    var color = playing ? 'rgba(139, 111, 71, 0.6)' : 'rgba(160, 147, 126, 0.32)'

    ctx.save()
    ctx.translate(cx, cy)
    if (playing) ctx.rotate(this._musicAngle)

    ctx.fillStyle = color
    ctx.strokeStyle = color

    ctx.save()
    ctx.translate(-3, 5)
    ctx.rotate(-0.3)
    ctx.scale(1, 0.72)
    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.fillRect(1.5, -12, 2, 17)

    ctx.beginPath()
    ctx.moveTo(3.5, -12)
    ctx.quadraticCurveTo(10, -8, 3.5, -3)
    ctx.lineWidth = 2.2
    ctx.stroke()

    ctx.restore()

    if (!playing) {
      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = '#A0937E'
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - 8, cy + 10)
      ctx.lineTo(cx + 8, cy - 10)
      ctx.stroke()
      ctx.restore()
    }
  },

  _wrapText: function (ctx, text, maxWidth) {
    var segments = text.split('\n')
    var lines = []
    for (var s = 0; s < segments.length; s++) {
      var seg = segments[s]
      var line = ''
      for (var i = 0; i < seg.length; i++) {
        var testLine = line + seg[i]
        if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
          lines.push(line)
          line = seg[i]
        } else {
          line = testLine
        }
      }
      lines.push(line)
    }
    return lines
  },

  onTouchStart: function (touch) {
    if (!this._bgmActivated) {
      this._bgmActivated = true
      var dx = touch.x - (this.width - 34)
      var dy = touch.y - (this.height - 54)
      if (dx * dx + dy * dy > 900 && sound.isBgmPlaying()) {
        sound.startBgm()
      }
    }
    if (this._modalConfig) return
    if (this.current && this.current.onTouchStart) {
      this.current.onTouchStart(touch, this)
    }
  },

  onTouchMove: function (touch) {
    if (this._modalConfig) return
    if (this.current && this.current.onTouchMove) {
      this.current.onTouchMove(touch, this)
    }
  },

  onTouchEnd: function (touch) {
    if (this.currentName === 'home') {
      var mdx = touch.x - (this.width - 34)
      var mdy = touch.y - (this.height - 54)
      if (mdx * mdx + mdy * mdy <= 900) {
        if (!this._bgmActivated) this._bgmActivated = true
        sound.toggleBgm()
        this._needsDraw = true
        return
      }
    }

    if (this._modalConfig) {
      if (this._modalBtnBounds) {
        var b = this._modalBtnBounds
        if (touch.x >= b.x && touch.x <= b.x + b.w && touch.y >= b.y && touch.y <= b.y + b.h) {
          var onConfirm = this._modalConfig.onConfirm
          this.hideModal()
          if (onConfirm) onConfirm()
        }
      }
      return
    }
    if (this.current && this.current.onTouchEnd) {
      this.current.onTouchEnd(touch, this)
    }
  },

  update: function (dt) {
    if (this._fadePhase !== 'none') {
      var elapsed = Date.now() - this._fadeStartTime
      if (this._fadePhase === 'out') {
        this._fadeAlpha = Math.min(1, elapsed / this._fadeDuration)
        if (elapsed >= this._fadeDuration) {
          this._immediateSwitch(this._pendingScene, this._pendingParams)
          this._fadePhase = 'in'
          this._fadeStartTime = Date.now()
          this._fadeAlpha = 1
        }
      } else if (this._fadePhase === 'in') {
        this._fadeAlpha = Math.max(0, 1 - elapsed / this._fadeDuration)
        if (elapsed >= this._fadeDuration) {
          this._fadePhase = 'none'
          this._fadeAlpha = 0
        }
      }
      this._needsDraw = true
    }

    if (sound.isBgmPlaying()) {
      this._musicAngle = (this._musicAngle + dt * 0.001) % (Math.PI * 2)
      this._needsDraw = true
    }

    if (this._toastText && Date.now() >= this._toastEndTime) {
      this._toastText = ''
      this._needsDraw = true
    }
    if (this.current && this.current.update) {
      this.current.update(dt, this)
    }
  },
}

module.exports = SceneManager
