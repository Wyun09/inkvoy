"""Record the completed offline image, never an incomplete shell build."""
import hashlib, json, pathlib, sys, tarfile
project=pathlib.Path(__file__).resolve().parents[2]
directory=project/'app/src/main/assets/runtime'
archive=directory/'debian-arm64.tar.gz'
stats=json.loads((project/'verification/image-stats.json').read_text())
def digest(path):
    with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
manifest=dict(id='debian13-arm64-studio2-20261018',debian='13',suite='trixie',architecture='arm64',abi='arm64-v8a',sha256=digest(archive),compressedBytes=archive.stat().st_size,**stats,maxArchiveEntries=stats['files']*3+2000)
manifest['tools']=[dict(name=n,version=v,kind=k) for n,v,k in [
 ('JADX','1.5.6','APK / DEX → Java'),('Apktool','3.0.3','资源 / Smali'),
 ('smali / baksmali','2.5.2.git2771eae','DEX 拆装'),('CFR','0.152','JAR / Class → Java'),
 ('radare2 + r2ghidra','6.2.4','ELF / SO 伪代码'),('Bash','5.2.37','PTY / Shell'),
 ('Python','3.13.5','脚本'),('Node / npm','20.19.2 / 9.2.0','JavaScript'),
 ('Git','2.47.3','版本管理'),('OpenJDK','21.0.12.1','Java'),('binutils / C++','2.44 / GCC 14','分析 / 构建')]]
required={'usr/bin/bash','usr/bin/python3','usr/bin/node','usr/local/bin/jadx','usr/local/bin/apktool','usr/local/bin/cfr','opt/studio/selftest/run.sh','opt/studio/provenance/packages.tsv','usr/share/common-licenses/GPL-2','usr/share/common-licenses/GPL-3'}
entries=0;total=0;members=[]
with tarfile.open(archive,'r:gz') as image:
    for member in image:
        name=member.name.removeprefix('./').rstrip('/')
        if name.startswith('/') or '..' in pathlib.PurePosixPath(name).parts:raise ValueError('Unsafe runtime path')
        if member.isdev():raise ValueError('Device file in offline image')
        if name.endswith(('id_rsa','id_ed25519','authorized_keys','.bash_history')) or '/.ssh/' in name:raise ValueError('Builder data in offline image')
        required.discard(name);entries+=1
        if member.isfile():total+=member.size
        members.append((name,member.type.decode('ascii'),member.size))
if required:raise ValueError('Missing runtime files: '+repr(required))
if total!=manifest['unpackedBytes']:raise ValueError(f'Expanded bytes differ: {total} vs {manifest["unpackedBytes"]}')
if entries>manifest['maxArchiveEntries']:raise ValueError('Too many runtime entries')
manifest['buildVerification']={'platform':'QEMU system Linux ARM64 (not Android)','toolAssertions':26,'nativeExecutionAssertions':14,'androidDeviceVerified':False}
(directory/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'sha256':manifest['sha256'],'compressedBytes':manifest['compressedBytes'],'regularFilePayloadBytes':total,'filesystemEntries':entries,'allRequiredFilesPresent':True,'noDeviceFiles':True,'noBuilderSshOrHistory':True,'nativeLibraries':{p.name:digest(p) for p in sorted((project/'app/src/main/jniLibs/arm64-v8a').glob('*.so'))},'nativeSources':{p.name:digest(p) for p in sorted((project/'app/src/main/cpp').glob('*.c'))}}
(project/'verification/runtime-image.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
