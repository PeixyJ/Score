#!/bin/bash

# 评分系统停止脚本

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}停止评分系统...${NC}"

# 清理端口 3000 和 5173
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# 清理相关 node 进程
pkill -f "node.*index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo -e "${GREEN}服务已停止${NC}"
