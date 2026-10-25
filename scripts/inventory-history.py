"""Inventory actual local snapshots before reconstructing a public Git history."""
import datetime,hashlib,json,pathlib,re,zipfile
root=pathlib.Path(__file__).resolve().parents[1];workspace=root.parent.parent;records=[]
def record(path,kind,metadata,raw):
    records.append(dict(path=str(path.resolve()),kind=kind,version=metadata.get('version'),metadataSha256=hashlib.sha256(raw).hexdigest(),snapshotTime=datetime.datetime.fromtimestamp(path.stat().st_mtime).isoformat(),gitHistoryVerified=False))
def directory(path):
    for folder in [path,path/'deepseek-android-bridge',path/'deepseek-android-studio']:
        p=folder/'package.json'
        if p.is_file():
            raw=p.read_bytes();record(folder,'source directory',json.loads(raw.decode('utf-8-sig')),raw);return
for p in (workspace/'work').iterdir():
    if p.is_dir() and p.name.startswith('android-') and not any(x in p.name for x in ['ndk','signing','toolchain']):directory(p)
for folder in pathlib.Path('D:/CodexBuild').iterdir():
    if not folder.is_dir() or not folder.name.startswith('deepseek-studio-'):continue
    for sub in [folder,folder/'delivery',folder/'final']:
        if not sub.is_dir():continue
        for p in sub.glob('*-source.zip'):
            try:
                with zipfile.ZipFile(p) as z:
                    name=next((n for n in z.namelist() if n.endswith('/package.json') and n.count('/')<=1),None)
                    if name:
                        raw=z.read(name);record(p,'ZIP metadata inspected',json.loads(raw),raw);records[-1]['bytes']=p.stat().st_size
            except Exception as e:records.append({'path':str(p),'error':str(e)})
report={'date':datetime.datetime.now().astimezone().isoformat(),'purpose':'Actual metadata inventory only; ZIP payload hashes, full history coverage and reconstruction are not yet verified. No commits, pushes or deletions performed.','records':records}
(root/'verification/history-inventory-500.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'records':len(records),'versions':sorted({r['version'] for r in records if r.get('version')}),'errors':sum('error'in r for r in records)}))
