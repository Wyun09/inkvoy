"""Publish release metadata only from passing final-artifact evidence."""
import argparse,datetime,hashlib,json,pathlib,re,xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--artifact-directory',type=pathlib.Path,default=pathlib.Path('C:/CodexBuild/inkvoy-5.0.0/delivery'));parser.add_argument('--verification-date');args=parser.parse_args()
read=lambda p:json.loads((root/p).read_text(encoding='utf8'))
def write(p,v):(root/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
stamp=args.verification_date or datetime.datetime.now().astimezone().isoformat();date=stamp[:10]
assert read('package.json')['version']=='5.0.0'
log=(root/'build/javascript-500-release.log').read_text(encoding='utf8')
def count(label):
    found=re.findall(r'(?m)^(?:ℹ|#) '+label+r' (\d+)\s*$',log)
    if not found:raise ValueError('Incomplete JS report: '+label)
    return int(found[-1])
js={k:count(label) for k,label in [('tests','tests'),('passed','pass'),('failed','fail'),('cancelled','cancelled'),('skipped','skipped')]}
assert js['tests']>=377 and js['passed']==js['tests'] and not any(js[k] for k in ['failed','cancelled','skipped']),js
style_log=(root/'build/motion-refinement-500.log').read_text(encoding='utf8')
style={k:int(re.findall(r'(?m)^(?:ℹ|#) '+label+r' (\d+)\s*$',style_log)[-1]) for k,label in [('tests','tests'),('passed','pass'),('failed','fail'),('cancelled','cancelled'),('skipped','skipped')]}
assert style['tests']==22 and style['passed']==22 and not any(style[k] for k in ['failed','cancelled','skipped']),style
style_delta=read('verification/post-style-delta-500.json');assert style_delta['changedPayloadEntries']==['assets/app.css']
native_log=(root/'build/android-500-release.log').read_text(encoding='utf8');assert 'BUILD SUCCESS' in native_log
reports=[]
for p in sorted((root/'build/android-runtime/surefire-reports').glob('TEST-*.xml')):
    suite=ET.parse(p).getroot();reports.append({'class':suite.get('name'),**{k:int(suite.get(k,'0')) for k in ['tests','failures','errors','skipped']}})
native={k:sum(r[k] for r in reports) for k in ['tests','failures','errors','skipped']}
assert native['tests']==196 and not any(native[k] for k in ['failures','errors','skipped']),native
payload=read('verification/apk-payload.json');deps=read('verification/dependencies-500.json');previews=read('verification/ui-previews-500.json');motion=read('verification/ui-motion-500.json');perf=read('verification/ui-performance-500.json')
assert payload['versionCode']==23 and payload['sameSignerAsV1'] and deps['allMatch']
assert not previews['javascriptErrors'] and len(previews['files'])>=22
for p in previews['files']:assert (root/p).is_file(),p
for r in motion['records']:
    assert r['distinctFrames']>=2
    for p in [r['video'],r['contactSheet']]+r['frames']:assert (root/p).is_file(),p
apk=args.artifact_directory/payload['apk']
assert apk.stat().st_size==payload['bytes'] and hashlib.file_digest(apk.open('rb'),'sha256').hexdigest()==payload['sha256']
assert style_delta['finalApkSha256']==payload['sha256']
evidence={}
for source,target in [('build/javascript-500-release.log','javascript-500.log'),('build/android-500-release.log','android-500.log'),('build/apk-5.0.0-output.log','apk-500.log'),('build/payload-500-release.log','payload-500.log'),('build/performance-500.log','performance-500.log'),('build/motion-inspection-500.log','motion-500.log')]:
    raw=(root/source).read_bytes();(root/'verification'/target).write_bytes(raw);evidence['verification/'+target]=hashlib.sha256(raw).hexdigest()
report={'version':'5.0.0','date':stamp,'javascript':js,'android':{**native,'frameworkSdk':[26,33],'plainJavaPipeTests':3,'reports':reports},'apk':payload,'logs':evidence,'productionScreenshots':sum(n.endswith('.png') for n in previews['files']),'motionVideos':[r['video'] for r in motion['records']],'decodedVideoFrameChecks':motion['records'],'dependencies':deps['checkedInstalledPackageVersions'],'physicalAndroidDevice':False,'realDeepseekAccount':False,'realOpenAiAccount':False,'realAndroidMcpProcess':False,'lockScreenBackground':False}
raw=(root/'build/motion-refinement-500.log').read_bytes();(root/'verification/motion-refinement-500.log').write_bytes(raw);evidence['verification/motion-refinement-500.log']=hashlib.sha256(raw).hexdigest();report['postStyleUi']={**style,'delta':style_delta}
write('verification/regression-500.json',report)
release=read('release.json');release.update(version='5.0.0',versionCode=23,buildDate=date,verificationDate=stamp,apk=payload['apk'],bytes=payload['bytes'],sha256=payload['sha256'],fix='FIX_5.0.0.md')
release['verification'].update(javascript=js['tests'],androidFrameworkRegression=native['tests'],sourcePayloadsCompared=len(payload['sourcePayloadsMatched']),currentRun=[str(js['tests'])+' JavaScript tests',str(native['tests'])+' Android API 26/33 framework and Java pipe-capture tests','Final APK signer, AssetManager image hash, payload comparison, portable paths and native alignment',str(report['productionScreenshots'])+' production UI screenshots and desktop fixture videos, decoded frames inspected','Desktop 4x CPU benchmark against signed 4.0.0 APK'],detailedRecord='verification/regression-500.json')
release['ui'].update(reference='DESIGN_5.0.md',adaptation='Original neutral graphite workspace, mobile bottom navigation, compact desktop sidebar, commands and references, continuous activity chain, live command logs and model-scoped context controls.',desktopRenderedPreviews=report['productionScreenshots'],currentVersionNewDesktopPreviews=report['productionScreenshots'],workspaceModules=['atelier5/*.css','composer.js','living-mark.js','browser-scripts.js','v4/workspace.js','v4/motion.js','v4/expressive-motion.js','expressive/*.css'],motionVideos=report['motionVideos'],logoGenerated=True,logoGeneration='branding/logo-generation-400.json',logoGenerationReusedFrom='4.0.0',logoStateAnimations=['idle','think','reply','search','read','write','terminal','browser','compact','tools','wait','success','error'],defaultAccent='graphite',minRestoreButtonCssPixels=44)
release['computerUse']['actions']=list(dict.fromkeys(release['computerUse']['actions']+['script']))
release['computerUse']['pageScripts']={'manualEditor':True,'awaitAndReturn':True,'maxSourceCharacters':32768,'callbackBudgetMs':5000,'synchronousLoopPreemption':False,'automaticallyRetried':False,'nativeJavascriptInterface':False,'maxResultCharacters':48000,'consoleLines':40}
release['display'].update(fullscreenDefault=True,fullscreenToggle=True,transientSystemBars=True,earlyDecorInitialization=True,collapsibleComposer=True)
release['streaming'].update(commandStdoutLive=True,simulatedCursor=False,characterPlaybackQueue=False,receivedChunksImmediate=True,newChunkTransitionMs=320,maxTransientChunkNodes=6,reasoningDisclosureTransitionMs=280)
release['ui']['logoTransition']={'singleIntactSilhouette':True,'fragmented':False,'poseTransitionMs':560,'continuousBreathingPhase':True,'loopSeconds':2.8,'phoneSizedMotionVerified':True}
release['verification']['postStyleUiChecks']=style['passed']
release['commandOutput']={'stdoutAndStderr':True,'coalesceMs':120,'maxFinalBytesPerStream':131072,'maxLiveCharactersPerStream':16000,'previewTransient':True,'confirmedExitCodeOnly':True,'scopedBy':['tool ID','project','monotonic sequence'],'latestCommandVisible':True,'manualCollapseRetained':True,'copy':True,'utf8AcrossChunks':True,'noOutputRetry':True,'physicalDeviceVerified':False}
release['modelCapabilities']={'automaticDiscoveryForExistingConnections':True,'source':'Selected model catalog metadata, or explicit manual per-model declaration','defaultEffortParameterOmitted':True,'nameBasedTierGuessing':False,'capacityAutomatic':True,'fallbackCapacityTokens':65536,'fallbackMarkedEstimate':True,'manualOneMillionOption':1000000,'allModelsAssumedOneMillion':False}
release['context']={'estimatesNotProviderTokenCounts':True,'capacitySourceVisible':True,'manualBoundToConnectionAndModel':True,'preserveOriginalTranscript':True,'recentCompleteTurnsPreserved':3,'autoThreshold':0.78,'guardThreshold':0.95,'partitionedRollingSummary':True,'atomicCheckpoint':True,'restore':True,'fork':True,'maxLocalSerializedCharacters':3000000}
release['composer']={'commands':23,'references':['project file snapshot','enabled skill','session excerpt','browser metadata'],'collapsible':True,'draftPreserved':True,'attachmentsPreserved':True}
release['workflow']={'modes':['execute','plan'],'humanGoalAndAcceptance':True,'structuredPlan':True,'humanApprovalBeforeExecution':True,'readOnlyPlanning':True,'defaultTeamMode':'solo','teamModes':['solo','subagent','team','cluster'],'realModelWorkers':True,'workerTools':['read_file','list_files','search_files','web_search'],'leaderOwnsMutations':True,'maxParallel':3,'maxTasksPerDispatch':6,'workerRoundBudget':{'default':4,'min':1,'max':12},'memberContextGuard':True,'mainHasFixedThirtyRoundLimit':False,'cluster':'Phone schedules configured model/API endpoints; not distributed execution devices','sameConnectionSerialized':True,'nativeApiIoThreads':4,'nativeConcurrentEndpointRegression':True,'realReportsAndErrors':True,'stopCancelsWorkers':True,'restartDoesNotAutomaticallyRetry':True,'physicalEndpointsVerified':False}
release['openAiAccount']['networkFailures']={'separateFromAuthorization':True,'inlineRetry':True,'anonymousNetworkDiagnosis':True,'doesNotSignOut':True,'phoneDnsFixedByThisBuild':False}
release['harnessSourceReview'].update(repository='https://github.com/deepseek-ai/deepseek-harness',commit='687f282e8625c6b8d11ff58211a90524be2e4317',fullParity=False,notes='HARNESS_PARITY.md')
release['performance']={'record':'verification/ui-performance-500.json','environment':perf['environment'],'combined':perf['combined'],'physicalAndroidDevice':False,'speedupClaimed':False}
release['historyMigration']={'inventory':'verification/history-inventory-500.json','plan':'GITHUB_MIGRATION.md','repositoryUrlPending':True,'commitsCreated':False,'sourcesDeleted':False}
release['knownIssues']=[i for i in release['knownIssues'] if 'command' not in i.lower() or 'background' in i.lower()]+['Real Android smoothness, coverage installation, logged-in model calls and lock-screen background behavior require physical-device validation.','The selected model context capacity is distinct from the bounded local conversation store.','Short page scripts support async results; synchronous infinite loops cannot be interrupted by the callback budget.']
write('release.json',release)
provenance=read('CORE_PROVENANCE.json');provenance['version']='5.0.0'
for name,value in provenance['modules'].items():
    path=root/'js/core'/name
    if path.is_file():value['localSha256']=hashlib.sha256(path.read_bytes()).hexdigest();value['unchanged']=value['localSha256']==value.get('sourceSha256')
provenance['platformExtensions']={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for folder in ['js','app/src/main/java'] for p in sorted((root/folder).rglob('*')) if p.is_file() and p.suffix in ['.js','.java','.css','.html']}
provenance['versionFive']={'design':'DESIGN_5.0.md','harnessReference':'HARNESS_PARITY.md','modelCatalog':'js/reasoning.js','contextProjection':'js/context.js','commandCapture':'app/src/main/java/io/github/deepseekbridge/CommandCapture.java','workflow':'js/workflow.js','coordination':'js/coordination.js','finalPayload':'verification/apk-payload.json'}
write('CORE_PROVENANCE.json',provenance)
current=perf['combined'][-1];old=perf['combined'][0]
(root/'VERIFICATION.md').write_text(f'''# Inkvoy 5.0.0 验收记录

验收时间：{stamp}。包名 io.github.deepseekbridge；versionCode 23；minSdk 26；targetSdk 35；ARM64 完整离线测试版。

## 最终产物

APK：{payload['apk']}，{payload['bytes']:,} bytes。SHA-256：`{payload['sha256']}`。

签名与旧版相同。v2/v3、ZIP 路径、DEX、原生 ELF 对齐和 {len(payload['sourcePayloadsMatched'])} 项源码负载匹配。AssetManager 从最终签名 APK 校验完整 Debian 镜像；尚未在用户手机验收覆盖安装。

## 自动检查

- JavaScript：{js['passed']} / {js['tests']} 通过；失败、取消、跳过均为 0。
- 全量回归后仅调整 Logo 的 CSS 摆动幅度；随后 {style['passed']} 项动效、流式、回复与目录针对检查通过。前后 APK 的代码与原生负载相同，仅 assets/app.css 不同，见 verification/post-style-delta-500.json。
- Android API 26/33 框架与 Java 管道采集：{native['tests']} 通过；失败、错误、跳过均为 0。其中管道检查 3 项；另以真实本机 HTTP 套接字验证 3 个端点和目录读取可以同时收到请求。
- {deps['checkedInstalledPackageVersions']} 项已安装依赖与锁文件逐项匹配；其他平台的可选二进制未装入本机是预期结果。
- 真实控件覆盖自动模型目录、1M 容量展示、精确推理档位请求、模型默认参数省略、命令与引用、文件摘录进入模型输入、收起与恢复草稿、页面脚本路由、账号 DNS 重试和最新命令输出。
- 日志验证覆盖 stdout/stderr 的进行中显示、重复/错项目事件拒绝、手动折叠保留、最终失败退出码、复制、预览不持久化及 UTF-8 跨块。
- 新增目标/计划/协作验证：计划执行权限、人工批准、验收证据、跨端点并发与同连接排队、子代理读写边界、全体停止、失败保留、容量预算、窄屏与横屏控件。
- 启动、全屏、IME 主线程、文件/媒体、MCP、HTTP 协议与持久化等回归保留。

完整分类与可校验日志：verification/regression-500.json。测试使用生产界面资源以及明确的 Native/model 夹具，Java 框架测试不等同于物理手机执行。

## 视觉与动效

{report['productionScreenshots']} 张生产页面截图，覆盖 390×844、844×390 与 1440×960。WebM 是实际页面操作录屏；使用 FFmpeg 解码多个时点，确认 Logo 形态、Inky 姿态和命令日志变化，并查看解码帧。页面没有 JavaScript 异常。

截图中的浏览器区域是 Native 表面占位，并非手机网页截屏。命令与账号数据为明确的测试夹具。记录见 verification/ui-previews-500.json 与 verification/ui-motion-500.json。

## 性能

{perf['environment']}

60 轮历史、4 倍 CPU 降速、每版 50 样本；采样时没有并发回归套件。4.0 中位 {old['renderMedianMs']:.2f} ms、P95 {old['renderP95Ms']:.2f} ms；5.0 中位 {current['renderMedianMs']:.2f} ms、P95 {current['renderP95Ms']:.2f} ms。不将单次桌面基准视为手机速度提升证据。两版重复 Native 布局调用均为 0；新 UI 挂载最近 20 轮，历史日志按需展开。

该数据不能换算为 Android 13 帧率或用户手机的点击延迟。日志事件有频率和长度上限，预览不触发整份会话持久化；动画后台暂停。手机流畅度仍需实测。

## 明确边界

没有连接物理 Android 手机，没有真实 DeepSeek/OpenAI 账号调用、锁屏后台、真实 Android MCP 进程或覆盖安装验收。网络分类与重试界面已修复，无法替手机修复系统 DNS / VPN 分流。模型目录没有公开元数据时不猜测容量或推理档位。模型容量与本地记录保存上限分开，详见 DESIGN_5.0.md。

Harness 功能仍有差距，见 HARNESS_PARITY.md。GitHub 目标地址尚未提供；本轮只清点历史，没有推送或删除旧源码。
''',encoding='utf8')
fix='''# Inkvoy 5.0.0

默认石墨色与紧凑布局，手机底部导航、宽屏窄侧栏、真实工具状态 Logo。输入栏可收起，并支持 `/` 命令、`@` 项目文件/技能/会话/网页引用。回复按说明与操作交错排列，长正文提供目录。

Logo 保持单个完整轮廓，以 560ms 过渡连接各状态，不再切成碎片。流式正文去掉模拟光标和逐字队列，完整增量立即进入界面，只让新片段柔和显现；已有正文不重播。思考区展开收起可中途反向，减少动态效果时直接显示。

模型目录自动提供当前模型推理档位和容量；未知保持模型默认并标明估算，可按文档手动设置。上下文显示、分块压缩、原始记录保留、恢复与会话分支已接入。

新增目标、计划模式、子代理、Agent Team 与多模型/API 端点集群。计划经用户批准后执行；子代理分析/读取/搜索，主代理统一写入，真实报告进入共享任务板，停止会取消所有子任务。

新增命令实时 stdout/stderr 预览、最终退出码、复制与展开收起。预览不代表完成；跨块 UTF-8、项目/调用身份与日志频率有界。浏览器新增手动/AI 页面脚本，支持 await/return 与有界结果。

默认沉浸全屏，并修复未附着窗口读取 InsetsController 的启动错误。账号域名解析错误与身份授权分离，可重试目录与诊断网络。切页不再取消后台模型元数据发现。

验证与局限：VERIFICATION.md。设计：DESIGN_5.0.md。上游能力差距：HARNESS_PARITY.md。未来版本历史与条件清理：GITHUB_MIGRATION.md。
'''
(root/'FIX_5.0.0.md').write_text(fix,encoding='utf8')
previous=(root/'README.md').read_text(encoding='utf8');history=previous[previous.index('## 4.0 更新'):]
intro='''# Inkvoy 5.0

面向网络安全研究、授权测试、逆向分析与编程的 Android AI 工作区。手机独立运行，内置 Debian 13 ARM64、PTY 终端、项目文件、AI 浏览器、MCP、技能与模型连接。

从输入栏的模型按钮或抽屉「模型与 API」填写自定义地址、密钥与模型 ID。已有连接自动读取目录；公开的推理档位与上下文容量按当前模型展示。未公布时保持默认、明确估算，不将所有模型假定为 1M。DeepSeek 网页连接继续使用页面实际支持的开关。

## 5.0 更新

- 白色 / 石墨色默认风格，手机四项底部导航、桌面窄侧栏与紧凑密度。原图生成的透明 Logo 增加 13 类状态形态，Inky 与真实任务状态同步。
- 输入框 `/` 命令、`@` 引用、收起草稿、上下文面板与分块压缩。保留完整原始会话，支持恢复与分支。
- 目标与验收条件、只读计划模式、编辑步骤与批准执行；真实子代理、Agent Team 任务板与多模型 API 端点集群，支持并发、取消和报告汇总。
- 命令执行时显示标准输出与错误输出，结束显示退出码、持续时间、超时和截断；支持换行、复制及手动折叠。
- AI 和手动浏览器页面脚本，支持 await/return；默认沉浸全屏，并修复早期窗口初始化问题。
- 账号网络错误保留身份授权，模型目录读取可重试和诊断。DNS / VPN 配置仍由手机系统控制。

完整离线 APK 约 588 MiB，包含 Debian；包名和签名延续旧版，供覆盖安装使用。请保留现有安装，直接安装新 APK。当前没有实体手机覆盖安装验收。

执行 `npm ci`、`npm run build:assets` 构建生产界面；完整 APK 使用 `scripts/build-apk.ps1` 与本机工具链/签名配置。签名私钥不包含在公开源码中。实际检查见 [VERIFICATION.md](VERIFICATION.md)，设计见 [DESIGN_5.0.md](DESIGN_5.0.md)，与 Harness 的差距见 [HARNESS_PARITY.md](HARNESS_PARITY.md)。

历史快照准备见 [GITHUB_MIGRATION.md](GITHUB_MIGRATION.md)。提供仓库后先恢复并验证发布历史，远端与全新 clone 通过后再清理重复旧源码；本轮没有删除。

'''
(root/'README.md').write_text(intro+history,encoding='utf8')
print(json.dumps({'version':'5.0.0','javascript':js,'android':native,'screenshots':report['productionScreenshots'],'apk':payload['sha256']}))
