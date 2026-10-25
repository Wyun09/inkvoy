# Inkvoy 产品宣传片

25 秒，1080×1920，30fps，H.264/AAC。输出目录默认位于项目同级 `inkvoy-promo/`。片尾指向已查到的公开仓库 `https://github.com/Wyun09/inkvoy`。

时间线：0–3.4 秒品牌；3.4–8.4 秒执行链；8.4–13.4 秒终端日志；13.4–18.4 秒多模型协作；18.4–22 秒 MCP/技能/API/App 操控；22–25 秒品牌与仓库。

画面来自生产 UI 在明确的 Native/model 夹具中的演示录屏，屏幕已标记「实际界面 · 示例任务演示」。不代表真实账号调用或物理手机验收。品牌、排版、转场和程序生成音效源于本工程，没有新增素材网站的音乐或视频。

编辑 `branding/promo.html` 修改文案与镜头；`scripts/render-promo.mjs` 提供确定性逐帧渲染、原创合成音效、H.264/AAC 编码、封面和校验清单。调用 `node scripts/render-promo.mjs --preview` 先生成六张检查帧；`node scripts/render-promo.mjs` 导出成片。使用项目已有的 Playwright/Edge，编码器默认在本机 `build/promo-tools/imageio_ffmpeg/binaries/` 查找，可通过 `--ffmpeg` 指定已有完整 FFmpeg。

本次本机编码工具来自 PyPI `imageio-ffmpeg==0.6.0`，通过 `py -m pip install --no-deps --target build/promo-tools imageio-ffmpeg==0.6.0` 安装到构建目录；该工具和二进制未作为 APK 或公开源码包负载分发。工具自身许可证以原包为准。播放视频不需要安装该工具。

成片需全量解码、查看关键时点并检查音轨；脚本导出成功本身不代替视觉检查。
