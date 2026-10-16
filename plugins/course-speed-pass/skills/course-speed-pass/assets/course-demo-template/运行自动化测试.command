#!/bin/zsh
set -e

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "首次运行，正在安装 Playwright……"
  npm install
fi

echo "正在检查测试用 Chromium……"
PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright" npx playwright install chromium || npx playwright install chromium

npm run automation
echo ""
echo "测试结束。按回车键关闭窗口。"
read
