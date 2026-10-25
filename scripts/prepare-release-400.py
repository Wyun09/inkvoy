"""Write release facts only after the actual JS, native and payload checks succeed."""
import datetime,hashlib,json,pathlib,re,shutil,xml.etree.ElementTree as ET,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
read=lambda p:json.loads((root/p).read_text(encoding='utf8'))
write=lambda p,v:(root/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
stamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat();date=stamp[:10]
log=(root/'build/javascript-400-verified.log').read_text(encoding='utf8')
def count(label):
    found=re.findall(r'ℹ '+label+r' (\d+)',log)
    if not found:raise ValueError('Incomplete JavaScript report: '+label)
    return int(found[-1])
js={k:count(label) for k,label in [('tests','tests'),('passed','pass'),('failed','fail'),('cancelled','cancelled'),('skipped','skipped')]}
assert js['tests']==js['passed'] and not any(js[k] for k in ['failed','cancelled','skipped']),js
native_log=(root/'build/android-400-verified.log').read_text(encoding='utf8');assert 'BUILD SUCCESS' in native_log
color_log=(root/'build/color-final.log').read_text(encoding='utf8');assert re.search(r'ℹ pass 3\b',color_log) and re.search(r'ℹ fail 0\b',color_log)
reports=[]
for path in sorted((root/'build/android-runtime/surefire-reports').glob('TEST-*.xml')):
    suite=ET.parse(path).getroot();reports.append({'class':suite.get('name'),**{k:int(suite.get(k,'0')) for k in ['tests','failures','errors','skipped']}})
native={k:sum(r[k] for r in reports) for k in ['tests','failures','errors','skipped']};assert native['tests']==181 and not(native['failures'] or native['errors'] or native['skipped']),native
payload=read('verification/apk-payload.json');previews=read('verification/ui-previews-400.json');motion=read('verification/ui-motion-400.json');perf=read('verification/ui-performance-400.json');deps=read('verification/dependencies-400.json')
assert payload['versionCode']==22 and payload['sameSignerAsV1'] and deps['allMatch']
for file in previews['files']+[motion['video']]:assert (root/file).is_file(),file
evidence={}
for source,target in [('build/javascript-400-verified.log','javascript-400.log'),('build/android-400-verified.log','android-400.log'),('build/apk-4.0.0-final.log','apk-400.log'),('build/payload-400.log','payload-400.log'),('build/performance-400.log','performance-400.log'),('build/color-final.log','color-400.log')]:
    raw=(root/source).read_bytes();(root/'verification'/target).write_bytes(raw);evidence['verification/'+target]=hashlib.sha256(raw).hexdigest()
report={'version':'4.0.0','date':stamp,'javascript':js,'android':{**native,'sdk':[26,33],'reports':reports},'apk':payload,'logs':evidence,'productionScreenshots':sum(n.endswith('.png') for n in previews['files']),'motionVideos':[motion['video'],motion['workingVideo']],'dependencies':deps['checkedInstalledPackageVersions'],'physicalAndroidDevice':False,'realDeepseekAccount':False,'realOpenAiAccount':False,'realAndroidMcpProcess':False}
with zipfile.ZipFile('D:/CodexBuild/deepseek-studio-4.0.0/final/'+payload['apk']) as before,zipfile.ZipFile('D:/CodexBuild/deepseek-studio-4.0.0/delivery/'+payload['apk']) as after:
    unchanged={name:hashlib.sha256(after.read(name)).hexdigest() for name in ['assets/engine.bundle.js','assets/compute.worker.js','assets/mcp.worker.js','classes.dex'] if before.read(name)==after.read(name)}
    assert len(unchanged)==4
report['postStyleVerification']={'checks':3,'passed':3,'failed':0,'change':'Dark overview service-action foreground contrast only','coreBytesUnchanged':unchanged,'newTest':'color-contrast.test.mjs','otherChecks':'ui.test.mjs rerun against final styles'}
write('verification/regression-400.json',report)
release=read('release.json');release.update(version='4.0.0',versionCode=22,buildDate=date,verificationDate=stamp,apk=payload['apk'],bytes=payload['bytes'],sha256=payload['sha256'],fix='FIX_4.0.0.md')
release['verification'].update(javascript=js['tests'],androidFrameworkRegression=native['tests'],androidMcpPlugins=26,sourcePayloadsCompared=len(payload['sourcePayloadsMatched']),currentRun=[str(js['tests'])+' JavaScript tests',str(native['tests'])+' Android API 26/33 tests against final signed APK','Final APK signing, assets, runtime hash, portable ZIP paths and native alignment','Production screenshots and two actual desktop interaction videos','Desktop benchmark against final 3.1.0 APK'],detailedRecord='verification/regression-400.json')
release['ui'].update(reference='https://m3.material.io/',adaptation='Original Material-inspired saturated flat-color workspace; persistent tool rail, document tabs, continuous activity journal, full-screen mobile model editor, interactive Inky and stateful generated reply logo.',desktopRenderedPreviews=report['productionScreenshots'],currentVersionNewDesktopPreviews=report['productionScreenshots'],workspaceModules=['v4/pages.js','v4/workspace.js','v4/lab-composition.js','v4/motion.js','v4/expressive-motion.js','v4/palette.js','expressive/*.css'],minPhysicalButtonCssPixels=24,motionVideos=report['motionVideos'],logoGenerated=True,logoGeneration='branding/logo-generation-400.json',logoStateAnimations=['thinking','tools','waiting','done','error','idle'],physicsInkyDrag=True)
release['agent']['specialization']=['cybersecurity','authorized penetration testing','reverse engineering','programming'];release['agent']['identitySharedAcrossConnections']=True
release['plugins']['builtinSkills']=['安全审计','授权渗透测试','逆向分析','排错与修复','代码审查','网页调研']
release['performance']={'record':'verification/ui-performance-400.json','environment':perf['environment'],'combined':perf['combined'],'physicalAndroidDevice':False}
write('release.json',release)
current=perf['combined'][-1]
verification=f'''# Inkvoy 4.0.0 验收记录

验收日期：{date}。包名 io.github.deepseekbridge；versionCode 22；minSdk 26；targetSdk 35；ARM64 完整离线测试版。

## 最终产物

APK：{payload['apk']}，{payload['bytes']:,} bytes。SHA-256：`{payload['sha256']}`。

签名证书与旧版相同；v2/v3 签名、原始 ZIP 路径、DEX、原生 ELF 对齐和 {len(payload['sourcePayloadsMatched'])} 项源码负载逐项匹配。Android AssetManager 从最终 APK 校验完整 Debian 镜像。设备上的覆盖安装尚未验收。

## 自动回归

- JavaScript、协议、浏览器、媒体、客户端及界面：{js['passed']} / {js['tests']} 通过，失败、取消、跳过均为 0。
- Android API 26/33 框架：{native['tests']} 通过，失败、错误、跳过均为 0。
- {deps['checkedInstalledPackageVersions']} 项已安装依赖版本与锁文件逐项匹配。
- API 保存与切换、流式正文、图片与文件附件、工具链、问答、终端、浏览器分屏和缩放、横竖屏、九档显示比例、返回焦点、存储不可用启动均有实际控件验证。
- 新增实际指针拖动 Inky、弹性回位、减少动态效果、真实工具状态驱动回复 Logo、稳定安全角色前缀、Native 安全技能安装和字体资源检查。
- 深色总览按钮对比度修正后另跑 3 项界面检查，全部通过，包括深浅色按钮文字对比度至少 4.5:1。协议引擎、两个 Worker 与 DEX 字节和完整回归时相同；最终 APK 重新执行全部 181 项 Native 检查。

逐类统计、日志及哈希：`verification/regression-400.json`。

## 视觉与动态

{report['productionScreenshots']} 张生产资源截图，覆盖 390×844、844×390、1440×960。深浅主题、工作状态、文件编辑、终端、工具、账号、MCP、技能、模型表单和设置均已渲染检查。两个 WebM 是实际页面操作录屏，包含拖动回弹、标签切换、品牌状态预览和等待终端结果时的真实状态动画。

截图和录屏由桌面 Edge 加明确的 Native/model 测试夹具产生。浏览器槽位是原生表面的占位展示，不是手机网页截图。设置中的动效预览明确标注，不会发起模型调用。见 `verification/ui-previews-400.json`、`verification/ui-motion-400.json`。

## 性能测量

{perf['environment']}

当前版本重复渲染中位数 {current['renderMedianMs']:.2f} ms、P95 {current['renderP95Ms']:.2f} ms；重复原生布局次数 {current['repeatedLayouts']}。完整对照在 `verification/ui-performance-400.json`。这是桌面模拟负载，不能推导手机帧率或点击延迟。弹簧共用一个 RAF，静止后停止；Native 浏览器槽位不会参与缩放位移动效。

## 尚未验证

没有连接实体 Android 手机，没有使用真实 DeepSeek/OpenAI 账号，没有进行手机锁屏后台、真实 MCP 本机进程或新包覆盖安装验收。保留这些限制，不把测试夹具当作真实账号调用结果。
'''
(root/'VERIFICATION.md').write_text(verification,encoding='utf8')
fix='''# Inkvoy 4.0.0

## 从布局到状态反馈

完整替换实际打包的旧样式，采用 Material 风格饱和纯色块、紫色品牌、常驻工具轨、顶部工作标签和连续执行记录。模型配置手机全屏、宽屏双栏；文件、终端、工具和设置使用独立工作面板。九档比例、方向、密度和主题仍可调。

新增有限弹簧控制器、活动导航块跟随、控件涟漪、分组弹性进入、Inky 拖动与回位。重新用内置图像工具生成透明 Logo；真实回复状态驱动思考、执行、等待、完成和错误变化，完成后停止。后台与减少动态效果会停止动画。

稳定系统角色专注网络安全、授权测试、逆向与编程，并增加三项可一键启用的 Native 技能。没有对底层模型做微调。网页协议、原生线程约束、工具日志和密钥存储保留。

实现与来源：DESIGN_4.0.md。实际验证、限制和性能对照：VERIFICATION.md。
'''
(root/'FIX_4.0.0.md').write_text(fix,encoding='utf8')
old=(root/'README.md').read_text(encoding='utf8');history=old[old.index('## 3.1.0 更新'):]
intro='''# Inkvoy 4.0

面向网络安全研究、授权渗透测试、逆向分析和编程的 Android AI 工作区。手机独立运行，内置 Debian 13 ARM64、真实 PTY 终端、项目文件、AI 浏览器、MCP、技能和多种模型连接。

默认使用应用内已登录的 DeepSeek 网页，也可从工具轨的模型连接、输入框模型按钮或侧栏「模型与 API」填写自定义地址、密钥、模型 ID。ChatGPT 账号入口保留；账号是否可以推理以实际授权目录为准。

## 4.0 更新

这次重做实际生产界面：饱和纯色块、深浅主题、工具轨、顶部标签、连续工具链、手机全屏模型表单和宽屏工作面板。新 Logo 由内置 imagegen 生成，回复时按真实状态变化。Inky 支持拖动回弹，标签与面板有弹性衔接，控件响应触点涟漪。主题与动效页提供明确标注的预览和减少动态效果开关。

安全方向写入所有连接共用的稳定系统前缀；内置安全审计、授权测试和逆向分析技能，使用实际证据与适当范围。原有编程、调试、网页调研继续可用。这是角色和工具工作流升级，不是对底层模型的微调。

包名与签名保留，可以用于覆盖安装；不要先卸载现有版本。离线 APK 包含完整 Debian 环境，因此约 588 MiB。网页、模型和在线搜索需要联网。实体手机上的覆盖安装和新动效流畅度仍需安装后确认。

设计与源码来源见 [DESIGN_4.0.md](DESIGN_4.0.md)，实际验证见 [VERIFICATION.md](VERIFICATION.md)，生成 Logo 和完整提示词见 [branding/logo-generation-400.json](branding/logo-generation-400.json)。

'''
(root/'README.md').write_text(intro+history,encoding='utf8')
print(json.dumps({'javascript':js,'android':native,'screenshots':report['productionScreenshots'],'date':date}))
