/**
 * 国风轻玩合集 - 抖音小游戏入口
 *
 * 职责：
 * 1. 创建全屏 Canvas 并做 DPR 高清适配
 * 2. 绑定全局触摸事件
 * 3. 启动 requestAnimationFrame 主循环
 * 4. 初始化场景管理器并切到首页
 * 5. 初始化用户登录
 */

var SceneManager = require('./scenes/sceneManager')
var auth = require('./utils/auth')
var share = require('./utils/share')
var ttCap = require('./utils/ttCapabilities')

var canvas = tt.createCanvas()
var ctx = canvas.getContext('2d')
var sysInfo = tt.getSystemInfoSync()

var screenWidth = sysInfo.screenWidth
var screenHeight = sysInfo.screenHeight
var dpr = sysInfo.pixelRatio || 2

var capsuleTop = 0
var capsuleBottom = 0
try {
  var menuBtn = tt.getMenuButtonBoundingClientRect()
  if (menuBtn && menuBtn.bottom) {
    capsuleTop = menuBtn.top
    capsuleBottom = menuBtn.bottom
  }
} catch (e) {
  var _sbh = sysInfo.statusBarHeight || 20
  capsuleTop = _sbh + 4
  capsuleBottom = _sbh + 36
}

canvas.width = screenWidth * dpr
canvas.height = screenHeight * dpr
ctx.scale(dpr, dpr)

SceneManager.init(ctx, screenWidth, screenHeight, capsuleTop, capsuleBottom)

function getTouchPos(e) {
  if (!e.touches && !e.changedTouches) return null
  var t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
  if (!t) return null
  return { x: t.clientX, y: t.clientY }
}

tt.onTouchStart(function (e) {
  var pos = getTouchPos(e)
  if (pos) SceneManager.onTouchStart(pos)
})

tt.onTouchMove(function (e) {
  var pos = getTouchPos(e)
  if (pos) SceneManager.onTouchMove(pos)
})

tt.onTouchEnd(function (e) {
  var pos = getTouchPos(e)
  if (pos) SceneManager.onTouchEnd(pos)
})

var _lastTime = Date.now()

function mainLoop() {
  var now = Date.now()
  var dt = now - _lastTime
  _lastTime = now

  SceneManager.update(dt)

  ctx.clearRect(0, 0, screenWidth, screenHeight)
  SceneManager.draw()

  requestAnimationFrame(mainLoop)
}

auth.init().then(function () {
  console.log('[Game] 用户初始化完成')
}).catch(function (err) {
  console.warn('[Game] 用户初始化失败', err)
})

share.setupShare()

SceneManager.switchTo('home')

setTimeout(function () {
  ttCap.checkSidebarScene()
}, 3000)
requestAnimationFrame(mainLoop)
