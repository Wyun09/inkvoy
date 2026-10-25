"""Check that the post-full-suite phone-logo adjustment changed only app.css."""
import argparse,hashlib,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--artifact-directory',type=pathlib.Path,required=True);args=p.parse_args()
before=args.artifact_directory/'deepseek-android-bridge-v5.0.0-before-visible-motion.apk';after=args.artifact_directory/'deepseek-android-bridge-v5.0.0.apk'
digest=lambda s:hashlib.file_digest(s,'sha256').hexdigest()
old_hash=digest(before.open('rb'));assert old_hash=='1ad34374d5f7e0127110de9d97fd3d7c34d3116bd8821da0d370ef54d2271d3c'
changed=[]
with zipfile.ZipFile(before) as a,zipfile.ZipFile(after) as b:
    names=lambda z:{n for n in z.namelist() if not n.startswith('META-INF/') and not n.endswith('/')}
    assert names(a)==names(b)
    for name in sorted(names(a)):
        with a.open(name) as x,b.open(name) as y:
            if digest(x)!=digest(y):changed.append(name)
assert changed==['assets/app.css'],changed
report={'fullSuiteApkSha256':old_hash,'finalApkSha256':digest(after.open('rb')),'changedPayloadEntries':changed,'codeAndNativePayloadsUnchanged':True,'reason':'After 381 passing full-suite tests, increase the intact phone-logo CSS motion amplitude. Followed by 22 focused UI/protocol tests and final APK verification.'}
(root/'verification/post-style-delta-500.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');print(json.dumps(report,indent=2))
