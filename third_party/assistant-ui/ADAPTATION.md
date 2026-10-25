# Claude example adaptation

Source: https://github.com/assistant-ui/assistant-ui/tree/e97f7c61365ef0f73686c7b596751802f1a1ddd2

MIT License, Copyright (c) 2025 AgentbaseAI Inc. Full upstream `LICENSE`,
`claude.tsx` and `clone-thread-shell.tsx` are included here. Source hashes are
recorded in `origin.json`. The license is also included in the APK's NOTICE.

The Claude example's compact conversation canvas, light composer with terracotta
send control, differentiated user/assistant messages, centered empty composer,
and the shell's thread search/mobile drawer were adapted to the existing
vanilla JavaScript Android WebView in `js/ui/studio.js` and `thread.css`.
The React components are reference sources, not bundled executable React code.

Our changes: new colors and typography, app's existing generated logo, local
project/terminal/file actions, actual DeepSeek thinking/search switches,
native permissions state, responsive Android layout, message-copy controls,
reduced-motion support and short drawer/message transitions. The original
generated companion uses actual local tool/task states; it is not Clawd or
an upstream brand asset. Its prompt and provenance are included in branding/.

There is no Claude model picker, voice button, or feedback endpoint: those
reference controls were replaced with operations this Android app supports.
No demo model output, reference networking, CDN assets, or upstream API keys
were copied into the running application.
