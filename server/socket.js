const { calculateRankings } = require('./routes/scores');

let io = null;

function initSocket(socketIo) {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 客户端请求最新排名
    socket.on('getRankings', () => {
      const rankings = calculateRankings();
      socket.emit('rankings', rankings);
    });

    // 评分更新时广播给所有客户端
    socket.on('scoreUpdated', () => {
      broadcastRankings();
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

// 广播最新排名给所有客户端
function broadcastRankings() {
  if (io) {
    const rankings = calculateRankings();
    io.emit('rankings', rankings);
  }
}

module.exports = { initSocket, broadcastRankings };
