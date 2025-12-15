const { calculateRankings } = require('./routes/scores');

let io = null;

// 在线用户追踪
const onlineJudges = new Map();  // socketId -> { id, name }
const onlinePublicVoters = new Set();  // socketId set

function initSocket(socketIo) {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 评委上线
    socket.on('judgeOnline', (judge) => {
      if (judge && judge.id && judge.name) {
        onlineJudges.set(socket.id, { id: judge.id, name: judge.name });
        console.log(`Judge online: ${judge.name} (${socket.id})`);
        broadcastOnlineStatus();
      }
    });

    // 评委下线（主动登出）
    socket.on('judgeOffline', () => {
      if (onlineJudges.has(socket.id)) {
        const judge = onlineJudges.get(socket.id);
        console.log(`Judge offline: ${judge.name} (${socket.id})`);
        onlineJudges.delete(socket.id);
        broadcastOnlineStatus();
      }
    });

    // 大众评委上线
    socket.on('publicVoterOnline', () => {
      onlinePublicVoters.add(socket.id);
      console.log(`Public voter online (${socket.id}), total: ${onlinePublicVoters.size}`);
      broadcastOnlineStatus();
    });

    // 客户端请求最新排名
    socket.on('getRankings', () => {
      const rankings = calculateRankings();
      socket.emit('rankings', rankings);
    });

    // 客户端请求在线状态
    socket.on('getOnlineStatus', () => {
      socket.emit('onlineStatus', getOnlineStatus());
    });

    // 评分更新时广播给所有客户端
    socket.on('scoreUpdated', () => {
      broadcastRankings();
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // 清理评委
      if (onlineJudges.has(socket.id)) {
        const judge = onlineJudges.get(socket.id);
        console.log(`Judge disconnected: ${judge.name}`);
        onlineJudges.delete(socket.id);
        broadcastOnlineStatus();
      }

      // 清理大众评委
      if (onlinePublicVoters.has(socket.id)) {
        onlinePublicVoters.delete(socket.id);
        console.log(`Public voter disconnected, remaining: ${onlinePublicVoters.size}`);
        broadcastOnlineStatus();
      }
    });
  });
}

// 获取在线状态
function getOnlineStatus() {
  // 去重评委（同一评委可能有多个连接）
  const uniqueJudges = new Map();
  onlineJudges.forEach((judge) => {
    uniqueJudges.set(judge.id, judge);
  });

  return {
    judges: Array.from(uniqueJudges.values()),
    publicVoterCount: onlinePublicVoters.size
  };
}

// 广播在线状态
function broadcastOnlineStatus() {
  if (io) {
    io.emit('onlineStatus', getOnlineStatus());
  }
}

// 广播最新排名给所有客户端
function broadcastRankings() {
  if (io) {
    const rankings = calculateRankings();
    io.emit('rankings', rankings);
  }
}

module.exports = { initSocket, broadcastRankings };
