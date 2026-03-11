/**
 * 音效 + 背景音乐模块
 *
 * 音效：WebAudio 程序化生成（点击/正确/错误/倒计时）
 * BGM：待接入外部音源（将 mp3 放入 audio/ 目录后启用）
 */

var _ctx = null

function _getCtx() {
  if (_ctx) return _ctx
  try {
    _ctx = wx.createWebAudioContext()
  } catch (e) { /* WebAudio 不可用 */ }
  return _ctx
}

function _tone(freq, dur, type, vol, delay) {
  var ac = _getCtx()
  if (!ac) return
  try {
    var t = ac.currentTime + (delay || 0)
    var osc = ac.createOscillator()
    var gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = type || 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol || 0.12, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur)
  } catch (e) { /* ignore */ }
}

function tap() { _tone(800, 0.06, 'sine', 0.08) }

function correct() {
  _tone(523, 0.15, 'sine', 0.12, 0)
  _tone(659, 0.2, 'sine', 0.12, 0.1)
  _tone(784, 0.3, 'sine', 0.10, 0.2)
}

function wrong() { _tone(200, 0.2, 'sawtooth', 0.06) }

function tick() { _tone(1000, 0.04, 'square', 0.04) }

/* ── BGM ── */

var _bgmPlaying = true
var _bgmAudio = null

try {
  _bgmAudio = wx.createInnerAudioContext()
  _bgmAudio.src = 'audio/guofeng_bgm.mp3'
  _bgmAudio.loop = true
  _bgmAudio.volume = 0.3
  _bgmAudio.autoplay = true
  _bgmAudio.onCanplay(function () {
    if (_bgmPlaying && _bgmAudio) _bgmAudio.play()
  })
  _bgmAudio.onError(function (res) {
    console.error('[BGM] error', res.errCode, res.errMsg)
  })
} catch (e) {
  console.error('[BGM] init failed', e)
}

function startBgm() {
  _bgmPlaying = true
  if (_bgmAudio) _bgmAudio.play()
}

function stopBgm() {
  _bgmPlaying = false
  if (_bgmAudio) _bgmAudio.pause()
}

function toggleBgm() {
  if (_bgmPlaying) stopBgm()
  else startBgm()
}

function isBgmPlaying() {
  return _bgmPlaying
}

module.exports = {
  tap: tap,
  correct: correct,
  wrong: wrong,
  tick: tick,
  startBgm: startBgm,
  stopBgm: stopBgm,
  toggleBgm: toggleBgm,
  isBgmPlaying: isBgmPlaying,
}
