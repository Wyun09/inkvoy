# Inkvoy 5.5 · Ink Instrument（设计分支）

本目录是 Inkvoy 5.5 界面重构的设计契约与可交互原型。**功能壳已于 2026-11-08 在 `feat/5.5-functional` 分支落地**（5.5.0-lite APK），主界面代码尚未合入 `main`；`main` 的 5.4.0 发布不受影响。

## 内容

| 文件 | 说明 |
| --- | --- |
| `DESIGN.md` | 设计契约草案：色彩 token、字体系统、布局与信息架构、组件契约、动效规范、验收门（含 v0.3–v0.5 修订记录） |
| `index.html` | 自包含可交互原型：浏览器直接打开即可。默认 390×844 手机布局，可点侧边栏、终端标签页、工具清单展开、设置开关与深浅色切换；支持 `?theme=dark`、`?layout=split`、`?screen=terminal|settings` |
| `screens/` | 关键界面截图（2×）：对话框浅色/深色、工具清单展开、侧边栏、白色终端、横屏分屏；`functional-*.png` 为已在真实 app 中实现的界面 |
| `motion.gif` | 动效预览：侧边栏滑入 → 终端切换 → 工具清单展开 → 设置切深色 |

## 状态与边界

- 方向：暖中性底 + 墨黑、单一亮绿信号、扁平哑光控件、等宽字体承担技术语义；导航为**侧边栏 + 设置模式**（无底部栏）。
- 字体：原型暂用 Geist / Noto Sans SC / JetBrains Mono 代替最终方案（MiSans 子集 + Maple Mono + Geist）；原型通过 Google Fonts 加载，离线打开时回退系统字体。
- 原型使用演示数据，未接入真实会话、终端与模型；动效为原型级验证，尚未在实体 Android WebView 上测帧率。
- 评审通过后再以 feature flag 形式进入 `main`，并保留 5.4.0 回退路径。
