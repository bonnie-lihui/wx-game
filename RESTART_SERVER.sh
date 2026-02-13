#!/bin/bash
# 重启后端服务到端口 5565

echo "🔄 正在重启后端服务..."

# 1. 停止旧进程
echo "停止旧进程..."
pkill -f "node.*app.js" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5565 | xargs kill -9 2>/dev/null
sleep 1

# 2. 启动新服务
echo "启动新服务（端口 5565）..."
cd /Users/momo/Desktop/vx-game/server
nohup node app.js > server.log 2>&1 &
NEW_PID=$!

sleep 2

# 3. 验证
if lsof -i:5565 > /dev/null 2>&1; then
    echo "✅ 后端服务已启动"
    echo "   端口: 5565"
    echo "   PID: $NEW_PID"
    echo ""
    echo "📡 访问地址："
    echo "   http://localhost:5565/health"
    echo ""
    tail -5 server.log
else
    echo "❌ 服务启动失败，查看日志："
    cat server.log
fi
