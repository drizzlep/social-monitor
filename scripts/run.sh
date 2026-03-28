#!/bin/bash
# 社媒情报平台 - 一键收集脚本
# 运行数据收集 + 详情补充

set -e

DATE=$(date +%Y-%m-%d)
TIME_START=$(date +%s)

echo "============================================"
echo "  社媒情报平台 - 数据收集"
echo "  日期: $DATE"
echo "============================================"

# 创建数据目录
mkdir -p data/$DATE

# Step 1: 收集数据
echo ""
echo "📡 Step 1: 收集数据..."
python3 scripts/collect.py

# Step 2: 补充详情
echo ""
echo "📖 Step 2: 补充详情..."
python3 scripts/enrich.py

# 完成
TIME_END=$(date +%s)
DURATION=$((TIME_END - TIME_START))

echo ""
echo "============================================"
echo "  ✅ 完成! 耗时: ${DURATION}秒"
echo "  📁 数据目录: data/$DATE"
echo "============================================"
