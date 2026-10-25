"""Record the real 5.1.1 hotfix checks without changing the previous release."""
from pathlib import Path
import json,re,hashlib,datetime,zipfile,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
delivery=Path('C:/CodexBuild/inkvoy-5.1.1/delivery')
def read(name):return json.loads((root/name).read_text(encoding='utf-8-sig'))
def write(name,value):(root/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert read('package.json')['version']=='5.1.1'
def js_counts(name):
    text=(root/name).read_text(encoding='utf8')
    return {key:int(re.findall(r'(?m)^ℹ '+label+r' (\d+)\s*$',text)[-1]) for key,label in [('tests','tests'),('passed','pass'),('failed','fail'),('cancelled','cancelled'),('skipped','skipped')]}
full=js_counts('build/javascript-511-full.log');rerun=js_counts('build/javascript-511-reply-rerun.log');focused=js_counts('build/javascript-511-settings.log')
assert full=={'tests':390,'passed':389,'failed':1,'cancelled':0,'skipped':0},full
assert rerun['tests']==rerun['passed']==5 and rerun['failed']==rerun['skipped']==0,rerun
assert focused['tests']==focused['passed']==12 and focused['failed']==focused['skipped']==0,focused
suites=[ET.parse(p).getroot() for p in (root/'build/android-runtime/surefire-reports').glob('TEST-*.xml')]
native={k:sum(int(s.get(k,'0')) for s in suites) for k in ['tests','failures','errors','skipped']};assert native=={'tests':230,'failures':0,'errors':0,'skipped':0},native
for f in ['build/android-511-settings.log','build/android-511-apk-tests.log']:assert 'BUILD SUCCESS' in (root/f).read_text(encoding='utf8')
payload=read('verification/apk-payload.json');assert payload['versionCode']==25 and payload['sameSignerAsV1']
apk=delivery/payload['apk'];assert hashlib.file_digest(apk.open('rb'),'sha256').hexdigest()==payload['sha256']
with zipfile.ZipFile(apk) as z:
    dex=z.read('classes.dex');assert b'android.settings.ACCESSIBILITY_SETTINGS' in dex
    assert b'android.settings.ACCESSIBILITY_DETAILS_SETTINGS' not in dex
    dex_hash=hashlib.sha256(dex).hexdigest()
compiled=next(Path('D:/CodexBuild/inkvoy-5.1.1/build').glob('dex-*/classes.dex'))
assert hashlib.sha256(compiled.read_bytes()).hexdigest()==dex_hash
stamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat()
logs={}
for source in ['android-511-settings.log','android-511-full.log','android-511-apk-tests.log','javascript-511-full.log','javascript-511-settings.log','javascript-511-reply-rerun.log','apk-5.1.1.log','payload-511.log']:
    b=(root/'build'/source).read_bytes();(root/'verification'/source).write_bytes(b);logs['verification/'+source]=hashlib.sha256(b).hexdigest()
report={'version':'5.1.1','date':stamp,'android':native,'androidSdk':[26,33],'javascript':{'initialFullRun':full,'replyUiRerun':rerun,'setupAndStartupChecks':focused,'uniqueChecksValidated':390,'note':'One existing reply test dereferenced the running tool node during the valid between-tools gap. Its wait predicate is now null-safe; all five reply tests pass. No reply runtime change was made.'},'apk':payload,'dexSha256':dex_hash,'protectedAccessibilityDetailsActionAbsentFromDex':True,'publicAccessibilitySettingsActionPresentInDex':True,'sourceDexMatchesApk':True,'logs':logs,'physicalAndroidDevice':False,'realAccessibilitySettingsScreenVerified':False,'earlierNativeRunNote':'The independent D: build directory meant the default build/resources.apk test path was absent. The two APK-dependent suites were rerun against the final signed 5.1.1 APK and passed; final suite XML totals are 230 with zero failures, errors or skipped tests.'}
write('verification/regression-511.json',report)
release={'version':'5.1.1','versionCode':25,'buildDate':stamp[:10],'package':'io.github.deepseekbridge',**{k:payload[k] for k in ['apk','bytes','sha256','signerSha256','minSdk','targetSdk']},'abi':'arm64-v8a','distribution':'offline test build','license':'GPL-3.0-only for project-owned code','runtime':read('app/src/main/assets/runtime/manifest.json'),'androidFrameworkTests':native['tests'],'javascriptChecksValidated':390,'focusedSetupAndStartupChecks':12,'physicalAndroidDeviceVerified':False,'verification':'verification/regression-511.json','changes':['Use the public accessibility settings list instead of the restricted service detail activity.','Guard both primary settings navigation and fallback against SecurityException and ActivityNotFoundException.','Show a manual settings path if no page can be opened.']}
write('release.json',release)
provenance=read('CORE_PROVENANCE.json');provenance['version']='5.1.1'
for section in ['platformExtensions','extensions']:
    for name in list(provenance.get(section,{})):
        if (root/name).is_file():provenance[section][name]=hashlib.sha256((root/name).read_bytes()).hexdigest()
provenance['hotfix']={'issue':'Android 13 OEM settings activity permission denial','files':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in ['app/src/main/java/io/github/deepseekbridge/AccessSettings.java','app/src/main/java/io/github/deepseekbridge/MainActivity.java','test/android-runtime/src/test/java/io/github/deepseekbridge/SettingsLaunchRegressionTest.java']},'verification':'verification/regression-511.json'};write('CORE_PROVENANCE.json',provenance)
(root/'VERIFICATION.md').write_text(f'''# Inkvoy 5.1.1 验证\n\n{stamp}，versionCode 25。\n\n修复系统无障碍详情页的权限拒绝：使用公开列表入口，主入口和回退都处理系统拒绝/页面缺失，均不可用时提供手动进入路径。\n\n- Android API 26/33 最终框架结果：230 项通过，失败/错误/跳过为 0；其中新增 12 项设置跳转回归。\n- 新手引导、App 操控入口、启动和生产包界面：12 项通过。\n- JavaScript 首次全量 390 项中 389 通过。原有回复测试在工具切换的合法空档里解引用了不存在的节点；只修正等待谓词空值检查，重跑回复测试 5 项全部通过。合并覆盖 390 个唯一检查，不宣称首次全量一次通过。\n- 首次全量原生测试使用默认 build/resources.apk，因本次独立构建目录位于 D 盘而缺少输入；相关两组已用最终签名 APK 重跑，22 项通过。最终 XML 汇总 230 项通过。\n- APK 所有资产和原生库匹配当前源码，DEX 与本次编译文件匹配；DEX 已无受限 ACCESSIBILITY_DETAILS_SETTINGS，包含公开 ACCESSIBILITY_SETTINGS。\n- 包名与原签名保留，离线镜像未更换。APK SHA-256：{payload['sha256']}。\n\n实体手机的厂商设置页跳转仍待覆盖安装确认；框架回归不等同于用户手机验收。上次保存的崩溃恢复页可点“重试启动”清除旧报告。\n\n完整记录与日志哈希见 verification/regression-511.json。\n''',encoding='utf8')
old=(root/'README.md').read_text(encoding='utf8')
intro='''# Inkvoy 5.1.1\n\n修复 Android 13 打开无障碍设置时因受限详情页权限导致的闪退。改用公开设置入口，系统拒绝或页面缺失均安全回退；无可用入口时显示手动进入路径。沿用包名和签名，可覆盖安装。详见 FIX_5.1.1.md 和 VERIFICATION.md。\n\n自有代码采用 GPL-3.0-only；第三方组件保留原许可证。\n\n'''
old=old.replace('# Inkvoy 5.1\n','',1).replace('完整版本历史迁移尚未执行。','版本历史正在从保存的源码快照导入。')
(root/'README.md').write_text(intro+old,encoding='utf8')
print(json.dumps({'version':'5.1.1','apk':str(apk),'sha256':payload['sha256'],'native':native,'javascriptUniqueValidated':390,'dexVerified':True}))
