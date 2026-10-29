# Inkvoy

**An Android AI workspace for coding, security research and reverse engineering.**

[中文](README.md) · [Build guide](docs/BUILD.md) · [Recovered history](docs/HISTORY.md) · [License](LICENSE)

![Inkvoy workspace](docs/assets/inkvoy-cover.jpg)

The product image uses demonstration task data.

Inkvoy brings streaming conversation, visible tool results, a Debian ARM64 terminal, project files and a shared browser into one Android workspace. It includes custom model connections, MCP, plugins and skills, context management, planning, goals and coordinated agents. App control is bounded by the user's selected applications, explicit session consent and pause controls.

Version 5.3.1 keeps the rebuilt mobile app shell and fixes OpenAI Responses streaming for text, reasoning and function-call arguments. Lightweight and offline APKs retain verified runtime package import. See [release notes](docs/RELEASE-5.3.1.md).

```sh
npm ci
npm run build:assets
npm test
```

An APK build additionally requires an Android toolchain and your own signing identity. Only the offline flavor needs the runtime image at build time. Large images, APKs and complete release archives are listed separately and have not been uploaded as GitHub Release attachments. See the build guide and EXTERNAL_ARTIFACTS.json.

Eighteen source versions have been recovered into individual commits and release branches. Their import dates are real restoration dates, and missing original sources are documented. Device and live-account verification limits are recorded in VERIFICATION.md.

Project-owned code is GPL-3.0-only. Third-party licenses and attribution remain applicable.
