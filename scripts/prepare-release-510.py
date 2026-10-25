"""Write 5.1 release metadata from final-artifact checks; no publication or Git writes."""
import argparse,datetime,hashlib,json,pathlib,re,xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--artifact-directory',type=pathlib.Path,default=pathlib.Path('C:/CodexBuild/inkvoy-5.1.0/delivery'));args=parser.parse_args()
read=lambda p:json.loads((root/p).read_text(encoding='utf-8-sig'))
def write(p,v):(root/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
stamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat();assert read('package.json')['version']=='5.1.0'
raw=(root/'build/javascript-510-release.log').read_text(encoding='utf8')
js={key:int(re.findall(r'(?m)^(?:ℹ|#) '+label+r' (\d+)\s*$',raw)[-1]) for key,label in [('tests','tests'),('passed','pass'),('failed','fail'),('cancelled','cancelled'),('skipped','skipped')]}
assert js['tests']>=390 and js['passed']==js['tests'] and not any(js[k] for k in ['failed','cancelled','skipped']),js
native_log=(root/'build/android-510-release.log').read_text(encoding='utf8');assert 'BUILD SUCCESS' in native_log
reports=[]
for p in sorted((root/'build/android-runtime/surefire-reports').glob('TEST-*.xml')):
    suite=ET.parse(p).getroot();reports.append({'class':suite.get('name'),**{k:int(suite.get(k,'0')) for k in ['tests','failures','errors','skipped']}})
native={k:sum(r[k] for r in reports) for k in ['tests','failures','errors','skipped']};assert native['tests']==218 and not any(native[k] for k in ['failures','errors','skipped']),native
payload=read('verification/apk-payload.json');previews=read('verification/ui-previews-510.json');motion=read('verification/ui-motion-510.json');deps=read('verification/dependencies-510.json');repo=read('verification/github-repository-510.json')
assert payload['versionCode']==24 and payload['sameSignerAsV1'] and deps['allMatch'];assert not previews['javascriptErrors'] and len(previews['files'])>=11
for p in previews['files']:assert (root/p).is_file(),p
for record in motion['records']:
    assert record['distinctFrames']>=2
    for p in [record['video'],record['contactSheet']]+record['frames']:assert (root/p).is_file(),p
apk=args.artifact_directory/payload['apk'];assert hashlib.file_digest(apk.open('rb'),'sha256').hexdigest()==payload['sha256']
service=(root/'verification/accessibility-service-510.txt').read_text(encoding='utf8',errors='replace')
for term in ['canRetrieveWindowContent','canPerformGestures','canTakeScreenshot']:assert term in service,term
assert repo['repository']=='Wyun09/inkvoy' and repo['public']
logs={}
for source,name in [('build/javascript-510-release.log','javascript-510.log'),('build/android-510-release.log','android-510.log'),('build/apk-5.1.0-output.log','apk-510.log'),('build/payload-510-release.log','payload-510.log'),('build/motion-inspection-510.log','motion-510.log')]:
    data=(root/source).read_bytes();(root/'verification'/name).write_bytes(data);logs['verification/'+name]=hashlib.sha256(data).hexdigest()
report={'version':'5.1.0','date':stamp,'javascript':js,'android':{**native,'frameworkSdk':[26,33],'reports':reports},'apk':payload,'logs':logs,'productionScreenshots':sum(p.endswith('.png') for p in previews['files']),'motion':motion,'dependencies':deps['checkedInstalledPackageVersions'],'physicalAndroidDevice':False,'realVpnOrDns':False,'realOpenAiAccount':False,'realDeepseekAccount':False,'realAccessibilityAppSession':False,'repository':repo,'earlierRunNotes':['UI coordination fixtures attempted background input before the settings modal finished closing. They now wait for the real hidden state; no unrelated draft implementation was changed.','The layout fixture now waits for an actual visible Native surface after font loading before checking repeated identical renders.']}
write('verification/regression-510.json',report)
release=read('release.json');release.update(version='5.1.0',versionCode=24,buildDate=stamp[:10],verificationDate=stamp,apk=payload['apk'],bytes=payload['bytes'],sha256=payload['sha256'],fix='FIX_5.1.0.md')
release['verification'].update(javascript=js['tests'],androidFrameworkRegression=native['tests'],sourcePayloadsCompared=len(payload['sourcePayloadsMatched']),currentRun=[f"{js['tests']} JavaScript tests",f"{native['tests']} Android API 26/33 framework and Java pipe tests",'Final signed APK payload, signer, DEX, ELF alignment and runtime-image checks','10 production screenshots, recorded UI and decoded video frames; Native/model fixtures explicitly marked'],detailedRecord='verification/regression-510.json');release['verification'].pop('postStyleUiChecks',None)
release['ui'].update(reference='DESIGN_5.1.md',desktopRenderedPreviews=report['productionScreenshots'],currentVersionNewDesktopPreviews=report['productionScreenshots'],motionVideos=[r['video'] for r in motion['records']]);release['ui']['setupJourney']={'steps':4,'skippable':True,'savedProgress':True,'realApiEditor':True,'examplesNeverAutoSend':True,'modalFocusTrap':True,'mobileSheetCompensatesDensity':True}
release['appControl']={'implementation':'Android AccessibilityService','defaultPaused':True,'systemEnableRequired':True,'userSelectedApplicationsOnly':True,'explicitSessionArming':True,'floatingPause':True,'toolsCannotSelfGrant':True,'blockedInPlanModeAndWorkers':True,'actions':['launch','observe','screenshot','click','long_click','type','clear','scroll','swipe','back','home','recents'],'revalidatedNodeRefs':True,'observedCoordinatesMaxAgeMs':30000,'passwordTextHidden':True,'systemPermissionDialogsHumanOnly':True,'screenshotMinApi':30,'offMainThreadImageEncoding':True,'projectCaptureFiles':True,'realPixelsInNextModelRequest':True,'protectedWindowBypass':False,'physicalDeviceVerified':False}
release['nativeNetwork']={'default':'system','optionalProxy':'HTTP host and port supplied by the user','anonymousSeparateHosts':['auth.openai.com','api.openai.com'],'proxyConnectUsesUnresolvedTarget':True,'loopbackBypassesProxy':True,'tlsCertificateValidationUnchanged':True,'dnsPoisoningAutomaticallyDiagnosed':False,'vpnPortGuessed':False,'phoneNetworkVerified':False}
release['openAiAccount']['networkFailures'].update(applicationProxyConfiguration=True,separateDnsAndHttpsProbes=True,phoneDnsFixedByThisBuild=False)
release['accessibility']={'readingScalePercent':[100,115,130,150],'higherContrast':True,'largerPhysicalTargets':True,'taskStatusAnnouncements':True,'streamChunksNotReadIndividually':True,'reducedMotion':True}
release['performance'].update(measuredVersion='5.0.0',historicalReferenceOnly=True,currentVersionSpeedupClaimed=False)
release['historyMigration'].update(repositoryUrl='https://github.com/Wyun09/inkvoy',repositoryUrlPending=False,commitsCreated=False,sourcesDeleted=False)
write('release.json',release)
provenance=read('CORE_PROVENANCE.json');provenance['version']='5.1.0'
for name,value in provenance['modules'].items():
    p=root/'js/core'/name
    if p.is_file():value['localSha256']=hashlib.sha256(p.read_bytes()).hexdigest();value['unchanged']=value['localSha256']==value.get('sourceSha256')
provenance['platformExtensions']={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for folder in ['js','app/src/main/java'] for p in sorted((root/folder).rglob('*')) if p.is_file() and p.suffix in ['.js','.java','.css','.html']}
provenance['versionFiveOne']={'design':'DESIGN_5.1.md','onboarding':'js/ui/setup-journey.js','appControl':'app/src/main/java/io/github/deepseekbridge/AppControlService.java','network':'app/src/main/java/io/github/deepseekbridge/NetworkSettings.java','regression':'verification/regression-510.json'};write('CORE_PROVENANCE.json',provenance)
(root/'VERIFICATION.md').write_text(f'''# Inkvoy 5.1.0 验收记录

时间：{stamp}。包名 io.github.deepseekbridge，versionCode 24，minSdk 26，targetSdk 35，ARM64 完整离线版。

APK：{payload['apk']}，{payload['bytes']:,} bytes，SHA-256 `{payload['sha256']}`。签名延续旧版；{len(payload['sourcePayloadsMatched'])} 项资源和原生负载逐项匹配源码，原生 ELF 满足 16 KiB 对齐。最终包的 Debian 镜像和权限声明已检查。

JavaScript 全量 {js['passed']}/{js['tests']}；Android API 26/33 框架与 Java 管道采集 {native['tests']} 项。失败、取消、跳过均为 0。{deps['checkedInstalledPackageVersions']} 项已安装依赖与锁文件匹配。完整计数、分类和日志哈希见 verification/regression-510.json。

新增覆盖：实际引导入口与 API 编辑器、跳过和进度、示例不自动发送、网络配置保存、两域名独立诊断、原生 HTTP CONNECT 在目标 DNS 不可解析时仍交给代理、本机地址绕过代理；实际 AccessibilityNodeInfo 输入与点击、密码隐藏、过期 ref、允许 App 范围、取消和暂停、截图期间界面改变拒绝、项目截图可重开及不可变聊天像素、App 截图进入下一次模型请求；字号、对比度、44px 点击区域、焦点、手机/横屏与缩放补偿。

早期 UI 超时已定位为测试在设置面板关闭前尝试向 inert 背景输入；测试改为等待实际关闭状态。另一个布局检查等待字体和真实可见的 Native 布局回调后再计数。不把测试输入时序问题写成产品草稿修复。

10 张当前生产资源截图、1 段界面录屏和 FFmpeg 解码帧已查看；界面数据使用明确的 Native/model 测试夹具。保留 5.0 的完整 Logo 呼吸、560ms 状态过渡、即时流式增量和 280ms 思考展开。该录屏不是手机真机录屏。

未连接物理 Android 手机，未验证用户 VPN/DNS、真实 OpenAI/DeepSeek 账号、其他 App 实际操控、覆盖安装或锁屏后台。原生框架测试不等同于手机验收。诊断不能单凭 UnknownHost 判定 DNS 污染，HTTP 401 只说明匿名 HTTPS 可达；账号权限仍以真实授权接口返回为准。显式代理需填写 VPN 实际提供的 HTTP 端口，TLS 校验保持启用。

5.1 没有新增手机帧率或速度提升测量；保留的 5.0 桌面数据只作历史记录。新版不会宣称已经修复手机系统 DNS。

仓库已从 GitHub 公开 API 查到 https://github.com/Wyun09/inkvoy；本轮没有上传源码或创建远端提交，也没有删除旧源码。仅清理可重建的中间 APK，见 verification/build-cleanup-510.json。
''',encoding='utf8')
(root/'FIX_5.1.0.md').write_text('''# Inkvoy 5.1.0

- 四步新手引导、真实连接入口、可跳过和保存进度；示例只填草稿。
- 新增 App 操控：系统无障碍服务、所选 App、单次允许、悬浮暂停、真实节点与截图。截图后台编码，保存项目文件并给下一次模型请求提供真实像素。
- 原生网络与 HTTP 代理设置；分别诊断授权域名、API 域名的系统解析与 HTTPS，不因系统 DNS 失败提前阻断代理请求，也不清除登录状态。
- 阅读字号、对比度、大点击区域、TalkBack 状态通知、焦点和减少动态效果；手机面板适配整体缩放。
- 原有 Logo、流式、终端输出、计划与团队协作保留。验证和物理手机边界见 VERIFICATION.md。
''',encoding='utf8')
old=(root/'README.md').read_text(encoding='utf8');history=old[old.index('## 5.0 更新'):]
intro='''# Inkvoy 5.1

Android 手机上独立运行的 AI 工作台，面向编程、安全研究与逆向分析，集成 Debian 终端、文件、AI 浏览器、MCP、技能与多模型协作。

An on-device Android AI workspace for coding, security research, and reverse engineering, with a terminal, AI browser, MCP, and multi-model agents.

仓库：https://github.com/Wyun09/inkvoy 。完整版本历史迁移尚未执行。

## 5.1 更新

- 抽屉「开始使用」：四步连接与工作环境引导，可跳过并随时重开；自定义 API 打开真实地址、密钥、模型编辑表单。
- 抽屉「App 操控」：由用户启用系统无障碍服务、选择 App 和允许本次操控。悬浮按钮可立即暂停。节点读取、点击、输入、清空、滚动、手势与 Android 11+ 系统截图；截图进入对话和模型图像输入，也保存在项目 captures/ 中。
- 抽屉或账号页「网络与代理」：跟随系统/VPN，或填写实际 HTTP 代理主机和端口；分别诊断授权与 API 域名，保留已授权身份。不预设 VPN 端口，不关闭 TLS 校验，不宣称已修复手机 DNS。
- 「阅读与辅助」：回复/思考字号、增强对比度、大点击区域、TalkBack 阶段通知及减少动态效果。手机面板适配界面缩放。
- 延续完整 Logo 动效、即时流式、命令实时输出、上下文、计划/目标、子代理和端点集群。

完整离线 APK 约 588 MiB，含 Debian ARM64；包名和签名延续旧版，供覆盖安装使用。尚未进行实体手机覆盖安装和其他 App 操控验收。

构建：npm ci → npm run build:assets；完整安装包使用 scripts/build-apk.ps1 与本机 Android 工具链/自行配置的签名。公开源码不含私钥、账号令牌或浏览器会话。检查见 VERIFICATION.md，设计见 DESIGN_5.1.md，上游差距见 HARNESS_PARITY.md。

历史快照与安全清理条件见 GITHUB_MIGRATION.md；已确认仓库后，仍须验证远端和全新 clone 恢复，再清理重复旧源码。宣传片源稿在 branding/promo.html 和 scripts/render-promo.mjs；界面素材是注明的示例任务演示。

'''
(root/'README.md').write_text(intro+history,encoding='utf8')
print(json.dumps({'version':'5.1.0','javascript':js,'android':native,'apk':payload['sha256'],'screenshots':report['productionScreenshots']}))
