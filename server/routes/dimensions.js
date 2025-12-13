const express = require('express');
const { prepare } = require('../db');

const router = express.Router();

// 获取所有评分维度
router.get('/', (req, res) => {
  const { track } = req.query;
  let sql = 'SELECT * FROM dimensions';
  let params = [];

  if (track) {
    sql += ' WHERE track = ?';
    params.push(track);
  }

  sql += ' ORDER BY track, order_num, id';
  const dimensions = prepare(sql).all(...params);
  res.json(dimensions);
});

// 创建评分维度
router.post('/', (req, res) => {
  const { name, track = 'A', max_score = 10, weight = 1.0 } = req.body;
  if (!name) {
    return res.status(400).json({ error: '名称不能为空' });
  }

  if (!['A', 'B'].includes(track)) {
    return res.status(400).json({ error: '赛道只能是 A 或 B' });
  }

  try {
    const maxOrder = prepare('SELECT MAX(order_num) as max FROM dimensions WHERE track = ?').get(track);
    const orderNum = (maxOrder?.max || 0) + 1;

    const result = prepare(
      'INSERT INTO dimensions (name, track, max_score, weight, order_num) VALUES (?, ?, ?, ?, ?)'
    ).run(name, track, max_score, weight, orderNum);

    res.json({ id: result.lastInsertRowid, name, track, max_score, weight, order_num: orderNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新评分维度
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, track, max_score, weight, order_num } = req.body;

  if (track && !['A', 'B'].includes(track)) {
    return res.status(400).json({ error: '赛道只能是 A 或 B' });
  }

  try {
    prepare(
      'UPDATE dimensions SET name = ?, track = ?, max_score = ?, weight = ?, order_num = ? WHERE id = ?'
    ).run(name, track, max_score, weight, order_num, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除评分维度
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  prepare('DELETE FROM dimensions WHERE id = ?').run(id);
  res.json({ success: true });
});

// 批量导入评分维度
// 格式: 赛道 名称 最高分 权重 (每行一个，空格分隔)
router.post('/batch', (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '数据列表不能为空' });
  }

  try {
    const results = [];
    const trackOrders = { A: 0, B: 0 };

    // 获取当前最大序号
    const maxOrderA = prepare('SELECT MAX(order_num) as max FROM dimensions WHERE track = ?').get('A');
    const maxOrderB = prepare('SELECT MAX(order_num) as max FROM dimensions WHERE track = ?').get('B');
    trackOrders.A = maxOrderA?.max || 0;
    trackOrders.B = maxOrderB?.max || 0;

    for (const item of items) {
      const { track, name, max_score, weight } = item;

      if (!track || !name || !['A', 'B'].includes(track)) continue;

      trackOrders[track]++;
      const result = prepare(
        'INSERT INTO dimensions (name, track, max_score, weight, order_num) VALUES (?, ?, ?, ?, ?)'
      ).run(name.trim(), track, max_score || 10, weight || 1.0, trackOrders[track]);

      results.push({
        id: result.lastInsertRowid,
        name: name.trim(),
        track,
        max_score: max_score || 10,
        weight: weight || 1.0
      });
    }

    res.json({ success: true, count: results.length, dimensions: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
