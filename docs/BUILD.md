# 构建与验证

## JavaScript / 界面

需要 Node.js 24 和 npm。UI 回归需要 Playwright 浏览器；Windows 使用已安装的 Microsoft Edge，Linux 可先运行 `npx playwright install --with-deps chromium`。

```sh
npm ci
npm run build:assets
npm test
```

发布资源默认压缩 JavaScript 和 CSS。定位界面错误时可用 `node scripts/build-assets.mjs --debug` 生成便于调试的 JavaScript；打包 APK 前重新运行默认构建。核心布局在 `js/ui/app-shell/`，构建时剔除旧业务样式中的核心选择器，记录在对应版本的 `verification/ui-engine-bundle-*.json`。

## Android

当前完整包面向 ARM64，minSdk 26、targetSdk 35。源代码中的预编译原生库保留其来源和许可证。

Windows 构建工具准备：

```powershell
./scripts/provision-android.ps1 -ToolsDirectory "$PWD/.build-tools/android"
```

5.2.0 起提供两种 APK：`lite` 不包含工具镜像，安装后聊天和浏览器可直接使用；终端、本机 MCP 需要在工具页导入工具包并初始化。`offline` 随包提供完整镜像。两种包使用同一包名和版本号，同一签名构建时可以互相覆盖安装。

完整 APK 要求 `app/src/main/assets/runtime/debian-arm64.tar.gz` 与同目录 manifest.json 的尺寸和 SHA-256 一致，也可以通过 `-RuntimeArchive` 从外部路径读取。该大型文件未放入普通 Git，也尚未上传 GitHub Release。可使用保存的发布镜像；自行构建需要独立的 Debian ARM64 构建机及下列脚本：

- scripts/make-runtime-fixtures.ps1：制作工具自测样本。
- scripts/runtime/build-image.sh：准备 Debian 与工具，运行工具自测。
- scripts/runtime/finalize-image.sh：记录包版本并打包镜像。
- scripts/runtime/record-runtime.py：记录生成镜像的元数据。
- scripts/runtime/fetch-debian-sources.py：获取对应 Debian 源码。

自行生成的镜像必须配套其真实清单，不能沿用不匹配的已发布哈希。构建签名由本机单独保管：

```powershell
./scripts/build-apk.ps1 `
  -Flavor offline `
  -Toolchain "$PWD/.build-tools/android/toolchain.json" `
  -SigningDirectory "$env:LOCALAPPDATA/Inkvoy/signing" `
  -BuildDirectory "$PWD/build" `
  -ArtifactDirectory "$PWD/dist"
```

轻量包使用 `-Flavor lite`，无需先取得镜像。产物名称分别为 `inkvoy-版本号-lite.apk` 和 `inkvoy-版本号-offline.apk`。构建过程中使用独立的临时资产目录，不移动或删除源码目录中的镜像。

工具包通过 Android 系统文件选择器导入，流式写入应用私有目录。只有文件大小和 SHA-256 均匹配 APK 内固定清单时才替换缓存；失败或取消会清除临时文件，保留之前验证的工具包。应用内“工具包发布页”打开 GitHub Releases；当前没有自动下载器，发布附件上传完成前请使用本地提供的工具包或完整版。

自己的签名与原发布签名不同，无法据此覆盖原签名的安装包。原私钥不在公开仓库。

## Android 框架回归

使用 JDK 17、Maven 3.9，以及脚本准备的 AndroidX 测试依赖：

```sh
python scripts/provision-android-test.py
mvn -f test/android-runtime/pom.xml -Dstudio.testApk=/absolute/path/to/the-built.apk test
```

`studio.testApk` 必须指向实际已构建的离线完整版 APK。相关测试检查编译后的包内资源，单有 Java 类无法代替这个输入。当前本地结果见 VERIFICATION.md；这些框架检查不代表已经完成实体手机验收。
