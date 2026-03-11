/**
 * 汉字找不同：国风字体矩阵，找出唯一不同的形近字
 *
 * 难度：easy(3x3) / normal(4x4) / hard(5x5) / hell(5x8)
 */

const { THEME } = require('../engine/constants')
const { roundRect } = require('../engine/inkStyle')

var CELL_GAP = 4

var DIFFICULTY_CONFIG = {
  easy:   { cols: 3, rows: 3, cellSize: 80 },
  normal: { cols: 4, rows: 4, cellSize: 68 },
  hard:   { cols: 5, rows: 5, cellSize: 58 },
  hell:   { cols: 6, rows: 8, cellSize: 48 },
}

function CharDiffLogic(options) {
  options = options || {}
  this.difficulty = options.difficulty || 'normal'
  var cfg = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.normal
  this.cols = cfg.cols
  this.rows = cfg.rows
  this.cellSize = cfg.cellSize

  this.base = options.base || null
  this.diff = options.diff || null

  if (!this.base || !this.diff) {
    throw new Error('CharDiffLogic: 缺少必要的题目数据 (base, diff)')
  }

  this.matrix = options.matrix || null
  this.diffAt = options.diffAt || null
  this.cells = []
  this.revealed = false
  this.tappedWrong = []
  this.score = 0

  if (!this.matrix) this._generateMatrix()
  this._buildCells()
}

CharDiffLogic.prototype._generateMatrix = function () {
  var arr = []
  for (var r = 0; r < this.rows; r++) {
    var row = []
    for (var c = 0; c < this.cols; c++) row.push(this.base)
    arr.push(row)
  }
  var dr = Math.floor(Math.random() * this.rows)
  var dc = Math.floor(Math.random() * this.cols)
  arr[dr][dc] = this.diff
  this.diffAt = { row: dr, col: dc }
  this.matrix = arr
}

CharDiffLogic.prototype._buildCells = function () {
  this.cells = []
  for (var r = 0; r < this.rows; r++) {
    for (var c = 0; c < this.cols; c++) {
      this.cells.push({
        row: r, col: c,
        x: c * (this.cellSize + CELL_GAP),
        y: r * (this.cellSize + CELL_GAP),
        char: this.matrix[r][c],
      })
    }
  }
}

CharDiffLogic.prototype.tap = function (row, col) {
  var hit = this.diffAt.row === row && this.diffAt.col === col
  var key = row + ',' + col
  var isRepeated = false

  if (hit) {
    this.revealed = true
  } else {
    isRepeated = this.tappedWrong.indexOf(key) >= 0
    if (!isRepeated) this.tappedWrong.push(key)
  }

  return { hit: hit, wrongCount: this.tappedWrong.length, isRepeated: isRepeated }
}

CharDiffLogic.prototype.calcScore = function (elapsedSec) {
  var baseScore = 100
  var timePenalty = Math.floor((elapsedSec || 0) * 1.5)
  var errorPenalty = this.tappedWrong.length * 12
  return Math.max(10, baseScore - timePenalty - errorPenalty)
}

CharDiffLogic.prototype.calcFinalScore = function (remainingSec, totalSec) {
  var elapsedSec = (totalSec || 0) - (remainingSec || 0)
  return this.calcScore(elapsedSec)
}

CharDiffLogic.prototype.getScoreBreakdown = function (remainingSec, totalSec) {
  var elapsedSec = (totalSec || 0) - (remainingSec || 0)
  return {
    totalScore: this.calcScore(elapsedSec),
    baseScore: 100,
    timePenalty: Math.floor(elapsedSec * 1.5),
    errorPenalty: this.tappedWrong.length * 12,
    elapsedSec: elapsedSec,
    wrongCount: this.tappedWrong.length,
  }
}

CharDiffLogic.prototype.getCellByPoint = function (x, y) {
  var cs = this.cellSize
  for (var i = 0; i < this.cells.length; i++) {
    var cell = this.cells[i]
    if (x >= cell.x && x <= cell.x + cs && y >= cell.y && y <= cell.y + cs) {
      return { row: cell.row, col: cell.col }
    }
  }
  return null
}

CharDiffLogic.prototype.draw = function (ctx, offsetX, offsetY) {
  offsetX = offsetX || 0
  offsetY = offsetY || 0
  var cs = this.cellSize
  ctx.save()
  ctx.translate(offsetX, offsetY)

  var totalW = this.cols * (cs + CELL_GAP) - CELL_GAP
  ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = THEME.nuanHui
  ctx.fillText('找出其中不同的一个字', totalW / 2, -14)

  for (var i = 0; i < this.cells.length; i++) {
    var cell = this.cells[i]
    var x = cell.x, y = cell.y
    var isDiff = cell.row === this.diffAt.row && cell.col === this.diffAt.col
    var isWrong = this.tappedWrong.indexOf(cell.row + ',' + cell.col) >= 0

    ctx.save()
    ctx.shadowColor = 'rgba(35,35,35,0.08)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 1
    roundRect(ctx, x, y, cs, cs, 8)
    ctx.fillStyle = this.revealed && isDiff ? 'rgba(200,37,6,0.12)' : '#FFFBF5'
    ctx.fill()
    ctx.restore()

    roundRect(ctx, x, y, cs, cs, 8)
    if (this.revealed && isDiff) {
      ctx.strokeStyle = THEME.zhuSha
      ctx.lineWidth = 2.5
    } else if (isWrong) {
      ctx.strokeStyle = '#CCC'
      ctx.lineWidth = 1
    } else {
      ctx.strokeStyle = THEME.danJin
      ctx.lineWidth = 0.8
    }
    ctx.stroke()

    var fontSize = cs > 70 ? 34 : (cs > 60 ? 30 : 26)
    ctx.font = fontSize + 'px "PingFang SC", "Microsoft YaHei", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = isWrong ? '#CCC' : THEME.moHei
    if (this.revealed && isDiff) ctx.fillStyle = THEME.zhuSha
    ctx.fillText(cell.char, x + cs / 2, y + cs / 2)

    if (this.revealed && isDiff) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x + cs - 6, y + 6, 8, 0, Math.PI * 2)
      ctx.fillStyle = THEME.zhuSha
      ctx.fill()
      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✓', x + cs - 6, y + 6)
      ctx.restore()
    }
  }
  ctx.restore()
}

module.exports = { CharDiffLogic: CharDiffLogic }
