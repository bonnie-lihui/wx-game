#!/bin/bash
# 国风轻玩合集 - 更新部署脚本
# 执行日期：2026-02-12
# 功能：提示功能、诗词连线随机数量、关卡去重

echo "=========================================="
echo "国风轻玩合集 - 功能更新部署"
echo "=========================================="
echo ""

# 1. 检查数据库连接
echo "步骤 1/4: 检查数据库表是否存在..."
mysql -u root -p -e "USE guofeng_game; SHOW TABLES LIKE 't_level_history';" > /tmp/check_table.txt 2>&1

if grep -q "t_level_history" /tmp/check_table.txt; then
  echo "✅ t_level_history 表已存在，跳过创建"
else
  echo "📝 创建 t_level_history 表..."
  mysql -u root -p guofeng_game < server/sql/04_level_history.sql
  if [ $? -eq 0 ]; then
    echo "✅ t_level_history 表创建成功"
  else
    echo "❌ 表创建失败，请手动执行：server/sql/04_level_history.sql"
    exit 1
  fi
fi

echo ""

# 2. 停止旧的后端进程
echo "步骤 2/4: 停止旧的后端进程..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ 旧进程已停止"
else
  echo "⚠️  端口3000未被占用"
fi

sleep 1
echo ""

# 3. 启动新的后端进程
echo "步骤 3/4: 启动后端服务..."
cd server
npm start > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "✅ 后端服务已启动 (PID: $SERVER_PID)"

sleep 3

# 4. 验证服务
echo ""
echo "步骤 4/4: 验证服务是否正常..."
curl -s http://localhost:3000/health | grep -q "ok"
if [ $? -eq 0 ]; then
  echo "✅ 后端服务运行正常"
  echo ""
  echo "=========================================="
  echo "部署完成！"
  echo "=========================================="
  echo ""
  echo "📋 更新内容："
  echo "  1. ✅ 玩法页面增加提示功能"
  echo "  2. ✅ 诗词连线随机生成4-8个"
  echo "  3. ✅ 关卡去重功能（避免重复）"
  echo ""
  echo "🔗 服务地址：http://localhost:3000"
  echo "📄 详细文档：docs/功能更新说明_20260212.md"
  echo ""
else
  echo "❌ 后端服务启动失败，请查看日志：/tmp/server.log"
  cat /tmp/server.log
  exit 1
fi
