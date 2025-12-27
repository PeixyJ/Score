const express = require('express');
const { prepare } = require('../db');

const router = express.Router();

// 获取评分配置
router.get('/', (req, res) => {
  const config = prepare('SELECT * FROM score_config WHERE id = 1').get();
  res.json(config || {
    professional_weight: 70,
    public_weight: 30,
    default_max_score: 5,
    show_public_vote_realtime: 1,
    ai_scoring_enabled: 0,
    ai_role_prompt: '你是一位专业的演讲评委，请根据演讲者的表达能力、内容质量、逻辑清晰度等方面进行评分。',
    deepseek_api_key: '',
    countdown_minutes: 0
  });
});

// 更新评分配置
router.put('/', (req, res) => {
  const {
    professional_weight,
    public_weight,
    default_max_score,
    show_public_vote_realtime,
    ai_scoring_enabled,
    ai_role_prompt,
    deepseek_api_key,
    countdown_minutes
  } = req.body;

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
      SET professional_weight = ?,
          public_weight = ?,
          default_max_score = ?,
          show_public_vote_realtime = ?,
          ai_scoring_enabled = ?,
          ai_role_prompt = ?,
          deepseek_api_key = ?,
          countdown_minutes = ?,
          updated_at = datetime('now')
      WHERE id = 1
    `).run(
      professional_weight,
      public_weight,
      default_max_score,
      show_public_vote_realtime ? 1 : 0,
      ai_scoring_enabled ? 1 : 0,
      ai_role_prompt || '',
      deepseek_api_key || '',
      countdown_minutes || 0
    );

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
