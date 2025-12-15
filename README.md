# 实时评分系统

一个支持多评委、多维度的实时评分系统，包含手机评分端、PC大屏展示和公众投票功能。

## 功能特性

- **多评委支持** - 每位评委通过唯一密钥识别身份
- **多维度评分** - 评分维度可自定义配置（名称、满分、权重）
- **实时排名** - PC大屏实时显示排名，分数变化时自动排序动画
- **公众投票** - 支持观众扫码参与投票
- **数据持久化** - 使用 SQLite 数据库存储所有数据
- **一键部署** - 提供启动/停止脚本，开箱即用

## 系统截图

![实时评分排行榜](./screenshot.png)

## 系统架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  手机评分端  │     │  PC大屏展示  │     │  公众投票端  │
│   /mobile   │     │   /screen   │     │   /vote     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │      WebSocket (Socket.IO)            │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────┴──────┐
                    │  后端服务    │
                    │  Express    │
                    │  :3000      │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   SQLite    │
                    │  score.db   │
                    └─────────────┘
```

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 启动服务
./start.sh

# 停止服务
./stop.sh
```

### 方式二：手动启动

**1. 启动后端服务**

```bash
cd server
npm install   # 首次运行需要安装依赖
npm start
```

后端将在 `http://localhost:3000` 启动。

**2. 启动前端服务**

```bash
cd client
npm install   # 首次运行需要安装依赖
npm run dev
```

前端将在 `http://localhost:5173` 启动。

## 访问地址

| 页面 | 地址 | 说明 |
|------|------|------|
| 首页 | `http://[IP]:5173/` | 入口页面，展示系统介绍 |
| 管理后台 | `http://[IP]:5173/admin` | 配置评委、选手、评分维度 |
| 手机评分 | `http://[IP]:5173/mobile` | 评委使用，手机扫码访问 |
| PC大屏 | `http://[IP]:5173/screen` | 实时显示排名和分数 |
| 公众投票 | `http://[IP]:5173/vote` | 观众扫码投票 |

> 将 `[IP]` 替换为你电脑的局域网 IP 地址（如 `192.168.1.100`）

## 使用流程

### 1. 初始配置（管理后台）

1. 访问管理后台 `/admin`
2. **添加评委**：输入名称后系统自动生成密钥
3. **添加选手**：输入需要被评分的人员名称
4. **配置评分维度**：设置评分项目（如：表现、创意、技术等），可调整满分和权重

### 2. 评委打分（手机端）

1. 手机访问 `/mobile`
2. 输入分配给自己的密钥登录
3. 选择要评分的选手
4. 为各维度打分后提交

### 3. 大屏展示（PC端）

1. PC 打开 `/screen` 全屏显示
2. 实时显示所有人的分数和排名
3. 当有新评分时自动更新并重新排序

### 4. 公众投票（可选）

1. 观众扫码访问 `/vote`
2. 为喜欢的选手投票

## 项目结构

```
Score/
├── server/                 # 后端服务
│   ├── index.js           # 入口文件
│   ├── db.js              # 数据库初始化
│   ├── socket.js          # WebSocket 实时通信
│   ├── score.db           # SQLite 数据库文件
│   └── routes/            # API 路由
│       ├── judges.js      # 评委管理
│       ├── contestants.js # 选手管理
│       ├── dimensions.js  # 评分维度
│       ├── scores.js      # 评分记录
│       └── public-ratings.js # 公众投票
│
├── client/                 # 前端应用
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   │   ├── Home.vue       # 首页
│   │   │   ├── Admin.vue      # 管理后台
│   │   │   ├── MobileScore.vue# 手机评分
│   │   │   ├── BigScreen.vue  # 大屏展示
│   │   │   └── PublicVote.vue # 公众投票
│   │   ├── stores/        # Pinia 状态管理
│   │   └── router/        # Vue Router 路由配置
│   └── ...
│
├── start.sh               # 一键启动脚本
├── stop.sh                # 一键停止脚本
└── README.md
```

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3 + Vite + TailwindCSS + Pinia |
| **后端** | Node.js + Express |
| **数据库** | SQLite (sql.js) |
| **实时通信** | Socket.IO |
| **二维码** | qrcode |

## API 接口

### 评委管理
- `GET /api/judges` - 获取所有评委
- `POST /api/judges` - 添加评委
- `DELETE /api/judges/:id` - 删除评委

### 选手管理
- `GET /api/contestants` - 获取所有选手
- `POST /api/contestants` - 添加选手
- `DELETE /api/contestants/:id` - 删除选手

### 评分维度
- `GET /api/dimensions` - 获取所有维度
- `POST /api/dimensions` - 添加维度
- `PUT /api/dimensions/:id` - 更新维度
- `DELETE /api/dimensions/:id` - 删除维度

### 评分记录
- `GET /api/scores` - 获取所有评分
- `GET /api/scores/rankings` - 获取排名数据
- `POST /api/scores` - 提交评分
- `DELETE /api/scores/:id` - 删除评分

### 公众投票
- `GET /api/public-ratings` - 获取投票统计
- `POST /api/public-ratings` - 提交投票

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

## 常见问题

**Q: 如何重置所有数据？**

删除 `server/score.db` 文件后重启服务，系统会自动创建新数据库。

**Q: 如何修改端口？**

- 后端端口：设置环境变量 `PORT=3001 npm start`
- 前端端口：修改 `client/vite.config.js`

**Q: 手机无法访问？**

确保手机和电脑在同一局域网内，并使用电脑的局域网 IP 地址访问。

## License

MIT
