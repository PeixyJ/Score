const express = require('express');
const { prepare } = require('../db');

const router = express.Router();

// 获取评分配置
router.get('/', (req, res) => {
  const config = prepare('SELECT * FROM score_config WHERE id = 1').get();
  res.json(config || { professional_weight: 70, public_weight: 30, default_max_score: 5, show_public_vote_realtime: 1 });
});

// 更新评分配置
router.put('/', (req, res) => {
  const { professional_weight, public_weight, default_max_score, show_public_vote_realtime } = req.body;

  // 验证权重
  if (professional_weight < 0 || public_weight < 0) {
    return res.status(400).json({ error: '权重不能为负数' });
  }

  if (default_max_score < 1) {
    return res.status(400).json({ error: '最高分必须大于0' });
  }

  try {
    prepare(`
      UPDATE score_config
      SET professional_weight = ?, public_weight = ?, default_max_score = ?, show_public_vote_realtime = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(professional_weight, public_weight, default_max_score, show_public_vote_realtime ? 1 : 0);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取评分配置（供其他模块使用）
function getScoreConfig() {
  const config = prepare('SELECT * FROM score_config WHERE id = 1').get();
  return config || { professional_weight: 70, public_weight: 30, default_max_score: 5, show_public_vote_realtime: 1 };
}

module.exports = router;
module.exports.getScoreConfig = getScoreConfig;
