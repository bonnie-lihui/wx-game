#!/usr/bin/env node
/**
 * 去重并统计诗词数据
 */
var data = require('../data/poetryData.js');
var EXCLUDED = new Set([
  '床前明月光|疑是地上霜', '春眠不觉晓|处处闻啼鸟', '举头望明月|低头思故乡',
  '白日依山尽|黄河入海流', '春风又绿江南岸|明月何时照我还',
  '两个黄鹂鸣翠柳|一行白鹭上青天', '独在异乡为异客|每逢佳节倍思亲',
  '千山鸟飞绝|万径人踪灭', '长安一片月|万户捣衣声',
  '日暮乡关何处是|烟波江上使人愁', '怀君属秋夜|散步咏凉天',
  '嗟余听鼓应官去|走马兰台类转蓬', '洛阳亲友如相问|一片冰心在玉壶',
  '海内存知己|天涯若比邻', '莫愁前路无知己|天下谁人不识君',
  '桃花潭水深千尺|不及汪伦送我情'
]);

function key(p) { return p[0] + '|' + p[1]; }

function dedup(arr) {
  var seen = new Set(), out = [];
  for (var i = 0; i < arr.length; i++) {
    var k = key(arr[i]);
    if (!EXCLUDED.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(arr[i]);
    }
  }
  return out;
}

var e = dedup(data.POETRY_EASY);
var n = dedup(data.POETRY_NORMAL);
var h = dedup(data.POETRY_HARD);

// 确保三个数组之间也无重复
var allSeen = new Set();
function dedupCross(arr, otherSeen) {
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var k = key(arr[i]);
    if (!otherSeen.has(k)) {
      otherSeen.add(k);
      out.push(arr[i]);
    }
  }
  return out;
}
e = dedupCross(e, allSeen);
n = dedupCross(n, allSeen);
h = dedupCross(h, allSeen);

console.log('After dedup: EASY=' + e.length + ' NORMAL=' + n.length + ' HARD=' + h.length + ' TOTAL=' + (e.length + n.length + h.length));
