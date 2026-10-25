# Inkvoy 4.0 — Color in motion

面向网络安全研究、授权测试、逆向分析和软件开发的 Android 工作区。

本版完整替换实际打包的应用样式。`js/ui/expressive/` 是唯一生产设计系统；早期版本的 `app.css`、`studio.css`、`workspace.css`、`design-system.css` 等不再拼入安装包。

## 视觉与布局

- 谷歌 Material 3 的颜色角色和形状运动作为设计参考。使用饱和紫、黄色、薄荷绿和蓝色纯色块；界面不使用渐变、玻璃、高光、立体阴影。
- 常驻窄工具轨、顶部工作标签、连续执行记录和底部指令区。文件浏览与编辑、终端、工具目录、模型连接采用各自的工作面板。
- 手机模型配置占满工作区，宽屏为连接列表与编辑双栏。旋转保留原输入 DOM，不丢弃未保存的表单。
- 完整深浅主题、强调色、内容密度、九档显示比例和屏幕方向。小比例允许普通控件缩小，恢复比例的九个按钮保持至少 44 CSS px。

## 可以实际操作的动态行为

1. 顶部标签和工具轨的选中块使用弹簧跟随目标。切换过程不会移动原生浏览器表面。
2. 饱和控件在触点位置显示有界涟漪，卡片和面板进入有弹性形变；列表以不同的弹性节奏展开。
3. Inky 可以拖动、释放回弹、点击打招呼。拖动保留指针捕获并限制位移；释放后回到自己的锚点，不保存临时位移。
4. 回复旁的新 Logo 按真实回复状态舒展旋转、执行加速、等待轻摆、完成回弹和错误反馈。已经完成的回复会停止循环。
5. 后台隐藏、系统减少动态效果和应用减少动态效果都会停止动态。弹簧共用一个 requestAnimationFrame，静止后不继续运行循环。设置页明确标注的预览不会发起 AI 请求。

图标变化与回复正文分离，正文保持增量渲染和工具结果验证。新动效不会给未知结果标上成功。原有协议、原生线程、SQLite 工具日志、密钥存储、终端与 Debian 镜像继续使用。

## 原创 Logo

使用内置 imagegen 图像工具生成，无外部图像 API。原始透明 PNG：`branding/logo-source.png`；生成规格记录：`branding/logo-generation-400.json`。启动器各密度与 `js/ui/logo.png` 由原图缩放打包，未重绘。回复头像以 PNG alpha 为 mask 显示纯色，并由代码根据状态驱动动画；这不是由模型实时生成的每帧视频。

## 开源与参考

- Motion mini / MIT：实际使用原生 Web Animations API 包装。
- Radix Colors / MIT：强调色选择的调色板。
- Lucide / ISC：实际应用图标。
- Geist / SIL OFL：随包本地字体，保留未修改的字体文件与许可。
- shadcn/ui / MIT：命令面板与分组导航的源码研究，来源固定在 `third_party/ui-v4/`。
- [Material 3 color](https://m3.material.io/styles/color/overview)、[motion](https://m3.material.io/styles/motion/overview)：视觉与运动参考。没有宣称此应用使用 Google 官方组件库。

自动回归、桌面生产资源截图与动作录屏见 `VERIFICATION.md`。桌面夹具不能替代实体手机、真实网页登录与账号授权验收。
