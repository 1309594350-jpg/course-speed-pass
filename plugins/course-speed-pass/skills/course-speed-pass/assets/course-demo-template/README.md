# 知行实验室：模拟网课自动化教学 Demo

这是一个完全本地运行的教学沙盒，用来学习网页状态、自动切换流程和 Playwright 端到端测试。

它不会连接学习通或其他网课平台，也不会读取账号、Cookie、真实课程或提交任何学习记录。

## 最简单的运行方式（macOS）

1. 双击 `启动演示.command`。
2. 浏览器会打开 `http://127.0.0.1:4173`。
3. 点击“从头运行自动演示”，观察六节模拟课程自动完成。
4. 关闭终端窗口即可停止本地服务器。

页面演示本身不需要安装任何依赖。只有第一次运行自动化测试时，才会安装 Playwright 和测试用 Chromium；双击测试脚本会优先使用国内镜像下载。

## 自动化测试

双击 `运行自动化测试.command`，脚本会：

1. 启动本地模拟课程。
2. 使用 Playwright 打开页面。
3. 将演示速度调整为 8 倍。
4. 运行自动播放和章节切换。
5. 断言最终结果为 `6/6`、`100%`。
6. 把成功截图保存到 `artifacts/automation-success.png`。

也可以在终端运行：

```bash
npm install
PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright" npx playwright install chromium
npm run automation
```

## 项目结构

```text
知行合一/
├── index.html                 # 模拟网课页面
├── styles.css                # 界面样式与响应式布局
├── src/app.js                # 课程状态机、播放与自动切换逻辑
├── scripts/server.mjs        # 只监听本机的静态服务器
├── automation/runner.mjs     # Playwright 外部自动化测试
├── artifacts/                # 自动化截图输出目录
├── 启动演示.command           # 双击启动页面
└── 运行自动化测试.command      # 双击执行完整测试
```

## GitHub 组件

自动化部分采用 [Microsoft Playwright](https://github.com/microsoft/playwright)，许可证为 Apache-2.0。页面主体没有使用第三方框架，便于直接阅读和修改。

## 学习建议

先在页面中手动播放、暂停、切换章节；然后阅读 `src/app.js` 理解状态变化；最后阅读 `automation/runner.mjs`，看浏览器外部脚本如何点击、等待和断言。
