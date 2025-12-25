const express = require('express');
const { prepare } = require('../db');

const router = express.Router();

// 获取所有赛道
router.get('/', (req, res) => {
  const tracks = prepare('SELECT * FROM tracks ORDER BY order_num, id').all();
  res.json(tracks);
});

// 创建赛道
router.post('/', (req, res) => {
  const { name, display_name, color = 'blue' } = req.body;

  if (!name || !display_name) {
    return res.status(400).json({ error: '赛道名称和显示名称不能为空' });
  }

  // 检查名称是否重复
  const existing = prepare('SELECT id FROM tracks WHERE name = ?').get(name);
  if (existing) {
    return res.status(400).json({ error: '赛道名称已存在' });
  }

  try {
    const maxOrder = prepare('SELECT MAX(order_num) as max FROM tracks').get();
    const orderNum = (maxOrder?.max || 0) + 1;

    const result = prepare('INSERT INTO tracks (name, display_name, color, order_num) VALUES (?, ?, ?, ?)').run(name, display_name, color, orderNum);
    res.json({ id: result.lastInsertRowid, name, display_name, color, order_num: orderNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新赛道
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, display_name, color, order_num } = req.body;

  // 检查名称是否与其他赛道重复
  if (name) {
    const existing = prepare('SELECT id FROM tracks WHERE name = ? AND id != ?').get(name, id);
    if (existing) {
      return res.status(400).json({ error: '赛道名称已存在' });
    }
  }

  try {
    prepare('UPDATE tracks SET name = ?, display_name = ?, color = ?, order_num = ? WHERE id = ?').run(name, display_name, color, order_num, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除赛道
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // 获取赛道名称
  const track = prepare('SELECT name FROM tracks WHERE id = ?').get(id);
  if (!track) {
    return res.status(404).json({ error: '赛道不存在' });
  }

  // 检查是否有关联的选手或维度
  const contestantCount = prepare('SELECT COUNT(*) as count FROM contestants WHERE track = ?').get(track.name);
  const dimensionCount = prepare('SELECT COUNT(*) as count FROM dimensions WHERE track = ?').get(track.name);

  if (contestantCount.count > 0 || dimensionCount.count > 0) {
    return res.status(400).json({
      error: `该赛道下还有 ${contestantCount.count} 名选手和 ${dimensionCount.count} 个评分维度，请先删除它们`
    });
  }

  prepare('DELETE FROM tracks WHERE id = ?').run(id);
  res.json({ success: true });
});

// 获取有效赛道名称列表（供验证用）
router.get('/names', (req, res) => {
  const tracks = prepare('SELECT name FROM tracks ORDER BY order_num').all();
  res.json(tracks.map(t => t.name));
});

module.exports = router;
