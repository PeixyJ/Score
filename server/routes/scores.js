const express = require('express');
const { prepare, saveDatabase, getDb } = require('../db');

const router = express.Router();

// 提交评分
router.post('/', (req, res) => {
  const { judge_id, contestant_id, scores, is_anonymous = false } = req.body;
  // scores: [{ dimension_id, score }]

  if (!judge_id || !contestant_id || !scores || !scores.length) {
    return res.status(400).json({ error: '参数不完整' });
  }

  try {
    for (const s of scores) {
      // 检查是否已存在
      const existing = prepare(
        'SELECT id FROM scores WHERE judge_id = ? AND contestant_id = ? AND dimension_id = ?'
      ).get(String(judge_id), contestant_id, s.dimension_id);

      if (existing) {
        prepare(
          'UPDATE scores SET score = ?, is_anonymous = ?, updated_at = datetime("now") WHERE id = ?'
        ).run(s.score, is_anonymous ? 1 : 0, existing.id);
      } else {
        prepare(
          'INSERT INTO scores (judge_id, contestant_id, dimension_id, score, is_anonymous, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
        ).run(String(judge_id), contestant_id, s.dimension_id, s.score, is_anonymous ? 1 : 0);
      }
    }

    saveDatabase();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取某个评分者对某个被评分者的评分
router.get('/judge/:judgeId/contestant/:contestantId', (req, res) => {
  const { judgeId, contestantId } = req.params;
  const scores = prepare(
    'SELECT dimension_id, score FROM scores WHERE judge_id = ? AND contestant_id = ?'
  ).all(judgeId, contestantId);

  res.json(scores);
});

// 删除某个评分者对某个被评分者的所有评分
router.delete('/judge/:judgeId/contestant/:contestantId', (req, res) => {
  const { judgeId, contestantId } = req.params;

  try {
    prepare(
      'DELETE FROM scores WHERE judge_id = ? AND contestant_id = ?'
    ).run(judgeId, contestantId);

    saveDatabase();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有被评分者的综合评分（用于大屏展示）
router.get('/rankings', (req, res) => {
  const { track } = req.query;
  const rankings = calculateRankings(track);
  res.json(rankings);
});

// 计算排名的函数（导出供 socket 使用）
function calculateRankings(filterTrack = null) {
  // 按赛道分组计算
  const tracks = filterTrack ? [filterTrack] : ['A', 'B'];
  const result = {};

  // 获取所有评分者
  const allJudges = prepare('SELECT id, name FROM judges ORDER BY id').all();

  for (const track of tracks) {
    const contestants = prepare('SELECT * FROM contestants WHERE track = ? ORDER BY order_num, id').all(track);
    const dimensions = prepare('SELECT * FROM dimensions WHERE track = ? ORDER BY order_num, id').all(track);

    const rankings = contestants.map(contestant => {
      const dimensionScores = dimensions.map(dim => {
        // 获取所有评分者对该被评分者该维度的评分（区分匿名和非匿名）
        const scores = prepare(
          'SELECT score, is_anonymous FROM scores WHERE contestant_id = ? AND dimension_id = ?'
        ).all(contestant.id, dim.id);

        let avgScore = 0;
        if (scores.length > 0) {
          // 加权计算：匿名评分权重20%，正式评分权重100%
          let totalWeight = 0;
          let weightedSum = 0;

          for (const s of scores) {
            const weight = s.is_anonymous ? 0.2 : 1.0;
            weightedSum += s.score * weight;
            totalWeight += weight;
          }

          avgScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        }

        return {
          dimension_id: dim.id,
          dimension_name: dim.name,
          max_score: dim.max_score,
          weight: dim.weight,
          avg_score: avgScore,
          judge_count: scores.length
        };
      });

      // 获取已评分的评分者ID列表
      const scoredJudges = prepare(
        'SELECT DISTINCT judge_id FROM scores WHERE contestant_id = ?'
      ).all(contestant.id).map(s => s.judge_id);

      // 获取大众点评统计
      const publicRatingStats = prepare(
        'SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM public_ratings WHERE contestant_id = ?'
      ).get(contestant.id);
      const publicRatingAvg = publicRatingStats.avg_rating ? Math.round(publicRatingStats.avg_rating * 100) / 100 : 0;
      const publicRatingCount = publicRatingStats.count || 0;

      // 计算加权总分
      const totalWeight = dimensions.reduce((acc, d) => acc + d.weight, 0);
      const weightedSum = dimensionScores.reduce((acc, ds) => {
        return acc + (ds.avg_score * ds.weight);
      }, 0);

      // 专业评分 + 大众点评平均分
      const professionalScore = totalWeight > 0 ? weightedSum / totalWeight * 10 : 0;
      const totalScore = professionalScore + publicRatingAvg;

      return {
        id: contestant.id,
        name: contestant.name,
        track: contestant.track,
        order_num: contestant.order_num,
        dimension_scores: dimensionScores,
        professional_score: Math.round(professionalScore * 100) / 100,
        public_rating_avg: publicRatingAvg,
        public_rating_count: publicRatingCount,
        total_score: Math.round(totalScore * 100) / 100,
        scored_judge_ids: scoredJudges
      };
    });

    // 按总分排序
    rankings.sort((a, b) => b.total_score - a.total_score);

    // 添加排名
    rankings.forEach((r, index) => {
      r.rank = index + 1;
    });

    result[track] = {
      contestants: rankings,
      dimensions: dimensions,
      judges: allJudges
    };
  }

  return result;
}

// 清空所有评分
router.delete('/clear-all', (req, res) => {
  try {
    prepare('DELETE FROM scores').run();
    prepare('DELETE FROM public_ratings').run();
    saveDatabase();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.calculateRankings = calculateRankings;
