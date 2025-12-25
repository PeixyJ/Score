const express = require('express');
const { prepare, saveDatabase } = require('../db');

const router = express.Router();

// Socket.IO 引用（由 index.js 设置）
let io = null;
function setIO(socketIO) {
  io = socketIO;
}

// 提交大众点评
router.post('/', (req, res) => {
  const { contestant_id, voter_id, rating } = req.body;

  if (!contestant_id || !voter_id || rating === undefined) {
    return res.status(400).json({ error: '参数不完整' });
  }

  if (rating < 0 || rating > 5) {
    return res.status(400).json({ error: '评分必须在0-5之间' });
  }

  try {
    // 检查是否已评分
    const existing = prepare(
      'SELECT id FROM public_ratings WHERE contestant_id = ? AND voter_id = ?'
    ).get(contestant_id, voter_id);

    if (existing) {
      prepare(
        'UPDATE public_ratings SET rating = ? WHERE id = ?'
      ).run(rating, existing.id);
    } else {
      prepare(
        'INSERT INTO public_ratings (contestant_id, voter_id, rating) VALUES (?, ?, ?)'
      ).run(contestant_id, voter_id, rating);
    }

    // 获取选手名称
    const contestant = prepare('SELECT name FROM contestants WHERE id = ?').get(contestant_id);

    // 广播实时投票事件
    if (io) {
      io.emit('publicVoteActivity', {
        contestantId: contestant_id,
        contestantName: contestant?.name || '未知选手',
        rating: rating,
        voterId: voter_id.substring(0, 8) + '***', // 隐藏部分ID
        timestamp: Date.now()
      });
    }

    saveDatabase();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取某个选手的大众点评统计
router.get('/contestant/:contestantId', (req, res) => {
  const { contestantId } = req.params;

  const stats = prepare(
    'SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM public_ratings WHERE contestant_id = ?'
  ).get(contestantId);

  res.json({
    count: stats.count || 0,
    avg_rating: stats.avg_rating ? Math.round(stats.avg_rating * 100) / 100 : 0
  });
});

// 获取某个投票者对某个选手的评分
router.get('/voter/:voterId/contestant/:contestantId', (req, res) => {
  const { voterId, contestantId } = req.params;

  const rating = prepare(
    'SELECT rating FROM public_ratings WHERE voter_id = ? AND contestant_id = ?'
  ).get(voterId, contestantId);

  res.json({ rating: rating?.rating ?? null });
});

// 删除某个投票者对某个选手的评分
router.delete('/voter/:voterId/contestant/:contestantId', (req, res) => {
  const { voterId, contestantId } = req.params;

  try {
    prepare(
      'DELETE FROM public_ratings WHERE voter_id = ? AND contestant_id = ?'
    ).run(voterId, contestantId);

    saveDatabase();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.setIO = setIO;
