const express = require('express');
const { prepare } = require('../db');

const router = express.Router();

let io = null;

// 设置 Socket.IO 引用
function setIO(socketIO) {
  io = socketIO;
}

// 获取 AI 评分配置
function getAIConfig() {
  const config = prepare('SELECT ai_scoring_enabled, ai_role_prompt, deepseek_api_key FROM score_config WHERE id = 1').get();
  return config || { ai_scoring_enabled: 0, ai_role_prompt: '', deepseek_api_key: '' };
}

// 调用 DeepSeek API 进行评分
async function callDeepSeekAPI(apiKey, rolePrompt, speechText, dimensions) {
  const dimensionInfo = dimensions.map(d => `${d.name}(满分${d.max_score}分，权重${d.weight})`).join('、');

  const systemPrompt = `${rolePrompt}

你需要根据以下评分维度对演讲进行评分：
${dimensionInfo}

请以JSON格式返回评分结果，格式如下：
{
  "overall_score": <总分，0-100>,
  "dimension_scores": {
    "<维度名称>": <该维度得分>
  },
  "feedback": "<简短的评价反馈，不超过100字>"
}

请只返回JSON，不要包含其他内容。`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `以下是演讲者的演讲内容：\n\n${speechText}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API 错误: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  // 解析 JSON 响应
  try {
    // 尝试提取 JSON（可能被包裹在 markdown 代码块中）
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('解析 DeepSeek 响应失败:', content);
    throw new Error('AI 响应格式错误');
  }
}

// 提交语音文本进行 AI 评分
router.post('/evaluate', async (req, res) => {
  const { contestant_id, speech_text, track } = req.body;

  if (!contestant_id || !speech_text) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const config = getAIConfig();

  if (!config.ai_scoring_enabled) {
    return res.status(400).json({ error: 'AI 评分未启用' });
  }

  if (!config.deepseek_api_key) {
    return res.status(400).json({ error: '未配置 DeepSeek API Key' });
  }

  try {
    // 获取评分维度
    const dimensions = prepare('SELECT * FROM dimensions WHERE track = ? ORDER BY order_num').all(track || 'A');

    // 调用 DeepSeek API
    const result = await callDeepSeekAPI(
      config.deepseek_api_key,
      config.ai_role_prompt,
      speech_text,
      dimensions
    );

    // 保存评分记录
    const { lastInsertRowid } = prepare(`
      INSERT INTO ai_scores (contestant_id, speech_text, score, feedback, dimension_scores)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      contestant_id,
      speech_text,
      result.overall_score,
      result.feedback,
      JSON.stringify(result.dimension_scores)
    );

    // 获取选手信息
    const contestant = prepare('SELECT name FROM contestants WHERE id = ?').get(contestant_id);

    const scoreData = {
      id: lastInsertRowid,
      contestant_id,
      contestant_name: contestant?.name || '未知选手',
      score: result.overall_score,
      feedback: result.feedback,
      dimension_scores: result.dimension_scores,
      speech_text: speech_text.substring(0, 100) + (speech_text.length > 100 ? '...' : ''),
      created_at: new Date().toISOString()
    };

    // 通过 Socket.IO 广播 AI 评分结果
    if (io) {
      io.emit('aiScoreUpdate', scoreData);
    }

    res.json({ success: true, data: scoreData });
  } catch (err) {
    console.error('AI 评分错误:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取选手的 AI 评分历史
router.get('/contestant/:contestantId', (req, res) => {
  const { contestantId } = req.params;

  const scores = prepare(`
    SELECT ai_scores.*, contestants.name as contestant_name
    FROM ai_scores
    LEFT JOIN contestants ON contestants.id = ai_scores.contestant_id
    WHERE contestant_id = ?
    ORDER BY created_at DESC
  `).all(contestantId);

  res.json(scores.map(s => ({
    ...s,
    dimension_scores: s.dimension_scores ? JSON.parse(s.dimension_scores) : {}
  })));
});

// 获取最新的 AI 评分记录
router.get('/latest', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const scores = prepare(`
    SELECT ai_scores.*, contestants.name as contestant_name
    FROM ai_scores
    LEFT JOIN contestants ON contestants.id = ai_scores.contestant_id
    ORDER BY ai_scores.created_at DESC
    LIMIT ?
  `).all(limit);

  res.json(scores.map(s => ({
    ...s,
    dimension_scores: s.dimension_scores ? JSON.parse(s.dimension_scores) : {}
  })));
});

// 清空所有 AI 评分
router.delete('/clear-all', (req, res) => {
  try {
    prepare('DELETE FROM ai_scores').run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.setIO = setIO;
