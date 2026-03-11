/**
 * 国风找成语：水墨成语矩阵，点击拼字
 *
 * 难度：easy(4x4) / normal(5x5) / hard(5x7)
 */

const { THEME } = require('../engine/constants')
const { roundRect } = require('../engine/inkStyle')

var CELL_GAP = 6

var DIFFICULTY_CONFIG = {
  easy:   { cols: 4, rows: 4, cellSize: 72 },
  normal: { cols: 5, rows: 5, cellSize: 64 },
  hard:   { cols: 5, rows: 7, cellSize: 52 },
}

var FILLER_POOL = '风云雨雷电山河湖海川日月星辰天地人和春秋冬夏东西南北金木水火土梅兰竹菊松柏桃李花鸟鱼虫龙凤鹤鹿琴棋书画诗词歌赋仁义礼智信忠孝勇勤俭'.split('')

function WordFindLogic(options) {
  options = options || {}
  this.answer = options.answer || ''
  this.difficulty = options.difficulty || 'easy'
  var cfg = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.easy
  this.cols = cfg.cols
  this.rows = cfg.rows
  this.cellSize = cfg.cellSize
  this.matrix = []
  this.selected = []
  this.cells = []
  this.isComplete = false
  this.score = 0
  this.attempts = 0
  this.wrongCount = 0
  this.initMatrix()
}

WordFindLogic.prototype.initMatrix = function () {
  var chars = this.answer.split('')
  var pool = FILLER_POOL.filter(function (c) { return chars.indexOf(c) < 0 })
  var flat = chars.slice()
  var total = this.cols * this.rows
  while (flat.length < total) {
    flat.push(pool[Math.floor(Math.random() * pool.length)])
  }
  for (var i = flat.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var tmp = flat[i]; flat[i] = flat[j]; flat[j] = tmp
  }
  this.matrix = []
  this.cells = []
  for (var r = 0; r < this.rows; r++) {
    var row = []
    for (var c = 0; c < this.cols; c++) {
      var idx = r * this.cols + c
      var ch = flat[idx]
      row.push(ch)
      this.cells.push({
        row: r, col: c,
        x: c * (this.cellSize + CELL_GAP),
        y: r * (this.cellSize + CELL_GAP),
        char: ch,
      })
    }
    this.matrix.push(row)
  }
}

WordFindLogic.prototype.tapCell = function (row, col) {
  var cell = null
  for (var i = 0; i < this.cells.length; i++) {
    if (this.cells[i].row === row && this.cells[i].col === col) { cell = this.cells[i]; break }
  }
  if (!cell) return { success: false }

  var existIdx = -1
  for (var k = 0; k < this.selected.length; k++) {
    if (this.selected[k].row === row && this.selected[k].col === col) { existIdx = k; break }
  }
  if (existIdx >= 0) {
    this.selected.splice(existIdx, 1)
    return { success: true, isComplete: false }
  }
  if (this.selected.length >= 4) return { success: false }
  this.selected.push({ row: cell.row, col: cell.col, char: cell.char })
  this.attempts++

  var str = ''
  for (var m = 0; m < this.selected.length; m++) str += this.selected[m].char
  this.isComplete = str === this.answer

  var isFull = this.selected.length === 4
  var isCorrect = this.isComplete

  if (isFull && !isCorrect) this.wrongCount++

  if (this.isComplete) {
    this.score = Math.max(10, 100 - (this.attempts - this.answer.length) * 10)
  }

  return { success: true, isComplete: this.isComplete, isFull: isFull, isCorrect: isCorrect }
}

WordFindLogic.prototype.calcFinalScore = function (remainingSec, totalSec) {
  var elapsedSec = (totalSec || 0) - (remainingSec || 0)
  var baseScore = 100
  var timeBonus = Math.floor((remainingSec || 0) * 1.2)
  var timePenalty = Math.floor(elapsedSec * 1.0)
  var errorPenalty = this.wrongCount * 8
  return Math.max(10, Math.min(100, baseScore + timeBonus - timePenalty - errorPenalty))
}

WordFindLogic.prototype.getScoreBreakdown = function (remainingSec, totalSec) {
  var elapsedSec = (totalSec || 0) - (remainingSec || 0)
  return {
    totalScore: this.calcFinalScore(remainingSec, totalSec),
    baseScore: 100,
    timeBonus: Math.floor((remainingSec || 0) * 1.2),
    timePenalty: Math.floor(elapsedSec * 1.0),
    errorPenalty: this.wrongCount * 8,
    elapsedSec: elapsedSec,
    remainingSec: remainingSec,
    wrongCount: this.wrongCount,
  }
}

WordFindLogic.prototype.getCellByPoint = function (x, y) {
  var cs = this.cellSize
  for (var i = 0; i < this.cells.length; i++) {
    var cell = this.cells[i]
    if (x >= cell.x && x <= cell.x + cs && y >= cell.y && y <= cell.y + cs) {
      return { row: cell.row, col: cell.col }
    }
  }
  return null
}

WordFindLogic.prototype.draw = function (ctx, offsetX, offsetY) {
  offsetX = offsetX || 0
  offsetY = offsetY || 0
  var cs = this.cellSize
  ctx.save()
  ctx.translate(offsetX, offsetY)

  if (this.selected.length > 0) {
    var previewY = -42
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    var str = ''
    for (var s = 0; s < this.selected.length; s++) str += this.selected[s].char
    var totalW = this.cols * cs + (this.cols - 1) * CELL_GAP
    roundRect(ctx, 0, previewY - 16, totalW, 32, 6)
    ctx.fillStyle = 'rgba(200, 37, 6, 0.08)'
    ctx.fill()
    ctx.fillStyle = THEME.zhuSha
    ctx.fillText('已选：' + str, totalW / 2, previewY)
  }

  for (var i = 0; i < this.cells.length; i++) {
    var cell = this.cells[i]
    var x = cell.x, y = cell.y
    var cx = x + cs / 2
    var cy = y + cs / 2
    var selIdx = -1
    for (var k = 0; k < this.selected.length; k++) {
      if (this.selected[k].row === cell.row && this.selected[k].col === cell.col) { selIdx = k; break }
    }
    var selected = selIdx >= 0

    ctx.save()
    if (!selected) {
      ctx.shadowColor = 'rgba(35, 35, 35, 0.1)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetY = 2
    }
    roundRect(ctx, x, y, cs, cs, 10)
    if (selected) {
      var g = ctx.createLinearGradient(x, y, x, y + cs)
      g.addColorStop(0, '#E63322')
      g.addColorStop(1, THEME.zhuSha)
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = '#FFFBF5'
    }
    ctx.fill()
    ctx.restore()

    roundRect(ctx, x, y, cs, cs, 10)
    ctx.strokeStyle = selected ? THEME.zhuSha : THEME.danJin
    ctx.lineWidth = selected ? 2 : 1
    ctx.stroke()

    if (selected) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x + cs - 8, y + 8, 10, 0, Math.PI * 2)
      ctx.fillStyle = THEME.qianMi
      ctx.fill()
      ctx.fillStyle = THEME.zhuSha
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(selIdx + 1), x + cs - 8, y + 8)
      ctx.restore()
    }

    var fontSize = cs > 60 ? 32 : (cs > 48 ? 26 : 22)
    ctx.font = selected
      ? ('bold ' + (fontSize + 2) + 'px "PingFang SC", "Microsoft YaHei", serif')
      : (fontSize + 'px "PingFang SC", "Microsoft YaHei", serif')
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = selected ? THEME.qianMi : THEME.moHei
    ctx.fillText(cell.char, cx, cy)
  }
  ctx.restore()
}

module.exports = { WordFindLogic: WordFindLogic }
