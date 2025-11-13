#!/bin/bash

# 游戏自动化测试和优化脚本
# 用法: ./run-tests.sh

set -e

echo "🎮 直升机逃脱游戏 - 自动化测试工具"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        echo "请安装 Node.js: https://nodejs.org/"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js 已安装: $(node --version)${NC}"
}

# 检查Python
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Python3 已安装: $(python3 --version)${NC}"
}

# 安装依赖
install_deps() {
    echo ""
    echo "📦 检查依赖..."
    
    if [ ! -d "node_modules" ]; then
        echo "正在安装测试依赖（puppeteer）..."
        npm install
        echo -e "${GREEN}✅ 依赖安装完成${NC}"
    else
        echo -e "${GREEN}✅ 依赖已存在${NC}"
    fi
}

# 启动服务器（后台）
start_server() {
    echo ""
    echo "🌐 启动本地服务器..."
    
    # 检查端口是否被占用
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  端口8080已被占用，尝试关闭...${NC}"
        kill $(lsof -t -i:8080) 2>/dev/null || true
        sleep 1
    fi
    
    # 启动服务器
    python3 -m http.server 8080 > /dev/null 2>&1 &
    SERVER_PID=$!
    echo -e "${GREEN}✅ 服务器启动 (PID: $SERVER_PID)${NC}"
    echo "   访问地址: http://localhost:8080"
    
    # 等待服务器就绪
    sleep 2
}

# 运行Node.js测试
run_node_tests() {
    echo ""
    echo "🧪 运行自动化测试..."
    echo ""
    
    if node test-game.js; then
        echo ""
        echo -e "${GREEN}✅ 自动化测试通过！${NC}"
    else
        echo ""
        echo -e "${RED}❌ 测试失败${NC}"
        cleanup
        exit 1
    fi
}

# 简单测试（不需要Node.js）
run_simple_test() {
    echo ""
    echo "🧪 运行简单测试..."
    
    # 检查文件是否存在
    REQUIRED_FILES=(
        "index.html"
        "src/main.js"
        "src/scenes/PlayScene.js"
        "src/scenes/MenuScene.js"
        "src/constants.js"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅${NC} $file"
        else
            echo -e "${RED}❌${NC} $file ${RED}(缺失)${NC}"
        fi
    done
    
    echo ""
    echo "📊 代码统计:"
    echo "   JavaScript文件: $(find src -name "*.js" | wc -l | xargs)"
    echo "   总代码行数: $(find src -name "*.js" -exec wc -l {} + | tail -1 | awk '{print $1}')"
    
    echo ""
    echo "🌐 游戏已运行在: http://localhost:8080"
    echo "   请手动打开浏览器测试"
    echo ""
    echo "按 Ctrl+C 停止服务器..."
    
    # 等待用户中断
    wait $SERVER_PID
}

# 清理
cleanup() {
    echo ""
    echo "🧹 清理环境..."
    
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        echo -e "${GREEN}✅ 服务器已关闭${NC}"
    fi
}

# 主流程
main() {
    # 检查环境
    check_python
    
    # 启动服务器
    start_server
    
    # 捕获退出信号
    trap cleanup EXIT INT TERM
    
    # 检查是否有Node.js
    if command -v node &> /dev/null; then
        check_node
        
        # 询问用户
        echo ""
        read -p "是否运行自动化测试？(需要安装puppeteer) [y/N]: " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_deps
            run_node_tests
            cleanup
        else
            run_simple_test
        fi
    else
        run_simple_test
    fi
}

# 运行
main
