const express = require('express');
const cors = require('cors');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');
const { initDatabase } = require('./db');

const app = express();
const server = http.createServer(app);

// 生成随机管理密码
const ADMIN_PASSWORD = crypto.randomBytes(4).toString('hex');

// Socket.IO 配置
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 获取本机 IP 地址
const { networkInterfaces } = require('os');
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// 初始化数据库后启动服务
async function startServer() {
  await initDatabase();

  // 路由（数据库初始化后再加载）
  const judgesRouter = require('./routes/judges');
  const contestantsRouter = require('./routes/contestants');
  const dimensionsRouter = require('./routes/dimensions');
  const scoresRouter = require('./routes/scores');
  const publicRatingsRouter = require('./routes/public-ratings');
  const tracksRouter = require('./routes/tracks');
  const configRouter = require('./routes/config');
  const aiScoresRouter = require('./routes/ai-scores');
  const { initSocket, broadcastRankings } = require('./socket');

  // 广播中间件（必须在路由之前注册）
  const broadcastMiddleware = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'DELETE') {
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        originalJson(data);
        // 延迟广播，确保数据库更新完成
        setTimeout(() => {
          broadcastRankings();
        }, 100);
      };
    }
    next();
  };

  // 先注册广播中间件
  app.use('/api/scores', broadcastMiddleware);
  app.use('/api/public-ratings', broadcastMiddleware);

  // 再注册路由
  app.use('/api/judges', judgesRouter);
  app.use('/api/contestants', contestantsRouter);
  app.use('/api/dimensions', dimensionsRouter);
  app.use('/api/scores', scoresRouter);
  app.use('/api/public-ratings', publicRatingsRouter);
  app.use('/api/tracks', tracksRouter);
  app.use('/api/config', configRouter);
  app.use('/api/ai-scores', aiScoresRouter);

  // 管理端密码验证
  app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: '密码错误' });
    }
  });

  // 初始化 Socket.IO
  initSocket(io);

  // 设置 public-ratings 的 Socket.IO 引用
  publicRatingsRouter.setIO(io);

  // 设置 ai-scores 的 Socket.IO 引用
  aiScoresRouter.setIO(io);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`
  ========================================
  评分系统后端已启动!
  ========================================
  本地访问: http://localhost:${PORT}
  局域网访问: http://${localIP}:${PORT}
  ----------------------------------------
  管理后台密码: ${ADMIN_PASSWORD}
  ========================================
    `);
  });
}

startServer().catch(console.error);
