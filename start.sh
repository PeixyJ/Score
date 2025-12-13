#!/bin/bash

# 评分系统一键启动脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 获取本机 IP
get_local_ip() {
    if command -v ipconfig &> /dev/null; then
        # macOS
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"
    else
        # Linux
        hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost"
    fi
}

LOCAL_IP=$(get_local_ip)

echo -e "${BLUE}"
echo "=========================================="
echo "        评分系统一键启动脚本"
echo "=========================================="
echo -e "${NC}"

# 清理占用的端口
cleanup_ports() {
    echo -e "${YELLOW}[1/4] 清理端口...${NC}"

    # 清理端口 3000
    if lsof -ti:3000 > /dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        echo -e "  端口 3000 已清理 ✓"
    else
        echo -e "  端口 3000 可用 ✓"
    fi

    # 清理端口 5173
    if lsof -ti:5173 > /dev/null 2>&1; then
        lsof -ti:5173 | xargs kill -9 2>/dev/null
        echo -e "  端口 5173 已清理 ✓"
    else
        echo -e "  端口 5173 可用 ✓"
    fi

    sleep 1
}

# 检查依赖是否安装
check_dependencies() {
    echo -e "${YELLOW}[2/4] 检查依赖...${NC}"

    if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
        echo -e "  安装后端依赖..."
        cd "$SCRIPT_DIR/server" && npm install --silent
    else
        echo -e "  后端依赖已安装 ✓"
    fi

    if [ ! -d "$SCRIPT_DIR/client/node_modules" ]; then
        echo -e "  安装前端依赖..."
        cd "$SCRIPT_DIR/client" && npm install --silent
    else
        echo -e "  前端依赖已安装 ✓"
    fi
}

# 启动后端
start_server() {
    echo -e "${YELLOW}[3/4] 启动后端服务...${NC}"
    cd "$SCRIPT_DIR/server"
    node index.js > /tmp/score-server.log 2>&1 &
    SERVER_PID=$!
    sleep 2

    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo -e "  后端服务已启动 ✓ (PID: $SERVER_PID)"
    else
        echo -e "${RED}  后端服务启动失败，查看日志:${NC}"
        cat /tmp/score-server.log
        exit 1
    fi
}

# 启动前端
start_client() {
    echo -e "${YELLOW}[4/4] 启动前端服务...${NC}"
    cd "$SCRIPT_DIR/client"
    npm run dev > /tmp/score-client.log 2>&1 &
    CLIENT_PID=$!
    sleep 3

    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        echo -e "  前端服务已启动 ✓ (PID: $CLIENT_PID)"
    else
        echo -e "${RED}  前端服务启动失败，查看日志:${NC}"
        cat /tmp/score-client.log
        exit 1
    fi
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在停止服务...${NC}"

    # 杀死后端进程
    if [ ! -z "$SERVER_PID" ] && ps -p $SERVER_PID > /dev/null 2>&1; then
        kill $SERVER_PID 2>/dev/null
        echo "  后端服务已停止"
    fi

    # 杀死前端进程
    if [ ! -z "$CLIENT_PID" ] && ps -p $CLIENT_PID > /dev/null 2>&1; then
        kill $CLIENT_PID 2>/dev/null
        echo "  前端服务已停止"
    fi

    # 清理端口
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    lsof -ti:5173 | xargs kill -9 2>/dev/null

    echo -e "${GREEN}服务已全部停止${NC}"
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 主流程
cleanup_ports
check_dependencies
start_server
start_client

echo -e "${GREEN}"
echo "=========================================="
echo "        评分系统启动成功!"
echo "=========================================="
echo -e "${NC}"
echo -e "  ${BLUE}访问地址:${NC}"
echo ""
echo -e "  首页:      http://localhost:5173"
echo -e "  管理后台:  http://localhost:5173/admin"
echo -e "  手机评分:  http://${LOCAL_IP}:5173/mobile"
echo -e "  PC大屏:    http://localhost:5173/screen"
echo ""
echo -e "  ${YELLOW}手机扫码访问: http://${LOCAL_IP}:5173/mobile${NC}"
echo ""
echo "=========================================="
echo -e "  按 ${RED}Ctrl+C${NC} 停止所有服务"
echo "=========================================="
echo ""

# 保持脚本运行
wait
