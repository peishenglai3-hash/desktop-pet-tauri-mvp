# Windows Build And Acceptance

## 环境准备

1. 安装 Node.js 20+。
2. 安装 Rust stable：`winget install Rustlang.Rustup`。
3. 安装 Microsoft C++ Build Tools，勾选 Desktop development with C++。
4. 安装 Microsoft Edge WebView2 Runtime。
5. 重启终端，确认：

```powershell
node --version
npm --version
rustc --version
cargo --version
```

## 本机构建

```powershell
npm install
npm run build
npm run tauri:build
```

## 验收清单

- 应用启动后无窗口边框，背景透明。
- 桌宠默认置顶，不出现在任务栏。
- 待机时不显示大面积对话框。
- 点击人物后打开笔记本式聊天面板。
- 聊天发送时进入等待动作，成功后进入庆祝/开心动作。
- 错误密钥显示友好错误，并进入失败动作。
- 托盘菜单可以显示窗口和退出。
- 安装器 `.exe` 与 `.msi` 可在干净 Windows 机器运行。

## 已知限制

当前本机工作区没有 Rust/Cargo，因此这里先完成工程与前端验证；最终安装包需要在装好 Rust 的 Windows 机器，或通过 GitHub Actions 生成。
