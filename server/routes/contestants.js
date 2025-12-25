const express = require('express');
const { prepare } = require('../db');

const router = express.Router();

// 获取有效赛道列表
function getValidTracks() {
  const tracks = prepare('SELECT name FROM tracks').all();
  return tracks.map(t => t.name);
}

// 获取所有被评分者
router.get('/', (req, res) => {
  const { track } = req.query;
  let sql = 'SELECT * FROM contestants';
  let params = [];

  if (track) {
    sql += ' WHERE track = ?';
    params.push(track);
  }

  sql += ' ORDER BY track, order_num, id';
  const contestants = prepare(sql).all(...params);
  res.json(contestants);
});

// 创建被评分者
router.post('/', (req, res) => {
  const { name, track = 'A' } = req.body;
  if (!name) {
    return res.status(400).json({ error: '名称不能为空' });
  }

  const validTracks = getValidTracks();
  if (!validTracks.includes(track)) {
    return res.status(400).json({ error: `无效的赛道，可用赛道: ${validTracks.join(', ')}` });
  }

  try {
    const maxOrder = prepare('SELECT MAX(order_num) as max FROM contestants WHERE track = ?').get(track);
    const orderNum = (maxOrder?.max || 0) + 1;

    const result = prepare('INSERT INTO contestants (name, track, order_num) VALUES (?, ?, ?)').run(name, track, orderNum);
    res.json({ id: result.lastInsertRowid, name, track, order_num: orderNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新被评分者
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, track, order_num } = req.body;

  if (track) {
    const validTracks = getValidTracks();
    if (!validTracks.includes(track)) {
      return res.status(400).json({ error: `无效的赛道，可用赛道: ${validTracks.join(', ')}` });
    }
  }

  try {
    prepare('UPDATE contestants SET name = ?, track = ?, order_num = ? WHERE id = ?').run(name, track, order_num, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除被评分者
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  prepare('DELETE FROM contestants WHERE id = ?').run(id);
  res.json({ success: true });
});

// 批量导入被评分者
router.post('/batch', (req, res) => {
  const { names, track = 'A' } = req.body;

  if (!names || !Array.isArray(names) || names.length === 0) {
    return res.status(400).json({ error: '名称列表不能为空' });
  }

  const validTracks = getValidTracks();
  if (!validTracks.includes(track)) {
    return res.status(400).json({ error: `无效的赛道，可用赛道: ${validTracks.join(', ')}` });
  }

  try {
    const maxOrder = prepare('SELECT MAX(order_num) as max FROM contestants WHERE track = ?').get(track);
    let orderNum = (maxOrder?.max || 0);

    const results = [];
    for (const name of names) {
      const trimmedName = name.trim();
      if (trimmedName) {
        orderNum++;
        const result = prepare('INSERT INTO contestants (name, track, order_num) VALUES (?, ?, ?)').run(trimmedName, track, orderNum);
        results.push({ id: result.lastInsertRowid, name: trimmedName, track, order_num: orderNum });
      }
    }

    res.json({ success: true, count: results.length, contestants: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
