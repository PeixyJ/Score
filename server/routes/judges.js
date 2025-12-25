const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { prepare } = require('../db');

const router = express.Router();

// 获取所有评分者
router.get('/', (req, res) => {
  const judges = prepare('SELECT id, name, secret_key, created_at FROM judges ORDER BY id').all();
  res.json(judges);
});

// 创建评分者
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: '名称不能为空' });
  }

  const secretKey = uuidv4().slice(0, 8).toUpperCase();

  try {
    const result = prepare('INSERT INTO judges (name, secret_key) VALUES (?, ?)').run(name, secretKey);
    res.json({ id: result.lastInsertRowid, name, secret_key: secretKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 验证密钥
router.post('/verify', (req, res) => {
  const { secretKey } = req.body;
  const judge = prepare('SELECT id, name FROM judges WHERE secret_key = ?').get(secretKey);

  if (judge) {
    res.json({ valid: true, judge });
  } else {
    res.json({ valid: false });
  }
});

// 更新评分者
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: '名称不能为空' });
  }

  try {
    prepare('UPDATE judges SET name = ? WHERE id = ?').run(name, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除评分者
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  prepare('DELETE FROM judges WHERE id = ?').run(id);
  res.json({ success: true });
});

// 批量导入评分者
router.post('/batch', (req, res) => {
  const { names } = req.body;

  if (!names || !Array.isArray(names) || names.length === 0) {
    return res.status(400).json({ error: '名称列表不能为空' });
  }

  try {
    const results = [];
    for (const name of names) {
      const trimmedName = name.trim();
      if (trimmedName) {
        const secretKey = uuidv4().slice(0, 8).toUpperCase();
        const result = prepare('INSERT INTO judges (name, secret_key) VALUES (?, ?)').run(trimmedName, secretKey);
        results.push({ id: result.lastInsertRowid, name: trimmedName, secret_key: secretKey });
      }
    }

    res.json({ success: true, count: results.length, judges: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
