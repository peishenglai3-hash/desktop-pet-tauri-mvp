# AI Desktop Pet MVP

一个面向 Windows EXE 的 AI 桌宠 MVP。当前版本已经包含透明置顶窗口、精灵表动画、点击展开聊天、DeepSeek/豆包 Provider 设置，以及 Tauri/Rust 侧的 OpenAI-compatible 调用骨架。

## 当前交互

- 待机状态：只显示人物和轻量提示，不显示大对话框。
- 点击人物：展开笔记本式聊天面板。
- 聊天发送：浏览器预览走 mock；Tauri EXE 内走 Rust Core 调用模型。
- 设置页：支持 DeepSeek 和豆包/火山方舟，API Key 保存到本机凭据管理器。

## 本地预览

```powershell
npm install
npm run dev
```

## Windows EXE 构建

需要先安装：

- Node.js 20+
- Rust stable
- Microsoft C++ Build Tools
- WebView2 Runtime

```powershell
npm install
npm run tauri:build
```

产物会出现在 `src-tauri/target/release/bundle/`。

## GitHub Actions

仓库内置 `.github/workflows/build-windows.yml`。推送到 GitHub 后，可以在 Actions 页面手动运行，自动产出 NSIS `.exe` 和 WiX `.msi`。

## 接口说明

DeepSeek 默认配置：

- Base URL: `https://api.deepseek.com`
- Model: `deepseek-v4-flash`

豆包/火山方舟默认配置：

- Base URL: `https://ark.cn-beijing.volces.com/api/v3`
- Model: 填写方舟控制台生成的 Endpoint ID

不要把真实 API Key 提交到 Git 仓库。正式 EXE 只通过本机凭据管理器保存密钥。
