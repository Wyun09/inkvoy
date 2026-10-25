# 构建与验证

## JavaScript / 界面

需要 Node.js 24 和 npm。UI 回归需要 Playwright 浏览器；Windows 使用已安装的 Microsoft Edge，Linux 可先运行 `npx playwright install --with-deps chromium`。

```sh
npm ci
npm run build:assets
npm test
```

## Android

当前完整包面向 ARM64，minSdk 26、targetSdk 35。源代码中的预编译原生库保留其来源和许可证。

Windows 构建工具准备：

```powershell
./scripts/provision-android.ps1 -ToolsDirectory "$PWD/.build-tools/android"
```

完整 APK 要求 `app/src/main/assets/runtime/debian-arm64.tar.gz` 与同目录 manifest.json 的尺寸和 SHA-256 一致。该大型文件未放入普通 Git，也尚未上传 GitHub Release。可使用保存的发布镜像；自行构建需要独立的 Debian ARM64 构建机及下列脚本：

- scripts/make-runtime-fixtures.ps1：制作工具自测样本。
- scripts/runtime/build-image.sh：准备 Debian 与工具，运行工具自测。
- scripts/runtime/finalize-image.sh：记录包版本并打包镜像。
- scripts/runtime/record-runtime.py：记录生成镜像的元数据。
- scripts/runtime/fetch-debian-sources.py：获取对应 Debian 源码。

自行生成的镜像必须配套其真实清单，不能沿用不匹配的已发布哈希。构建签名由本机单独保管：

```powershell
./scripts/build-apk.ps1 `
  -Toolchain "$PWD/.build-tools/android/toolchain.json" `
  -SigningDirectory "$env:LOCALAPPDATA/Inkvoy/signing" `
  -BuildDirectory "$PWD/build" `
  -ArtifactDirectory "$PWD/dist"
```

自己的签名与原发布签名不同，无法据此覆盖原签名的安装包。原私钥不在公开仓库。

## Android 框架回归

使用 JDK 17、Maven 3.9，以及脚本准备的 AndroidX 测试依赖：

```sh
python scripts/provision-android-test.py
mvn -f test/android-runtime/pom.xml -Dstudio.testApk=/absolute/path/to/the-built.apk test
```

`studio.testApk` 必须指向实际已构建的 APK。相关测试检查编译后的包内资源，单有 Java 类无法代替这个输入。当前 5.1.1 本地最终结果见 VERIFICATION.md；这些框架检查不代表已经完成实体手机验收。
