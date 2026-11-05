"""Verify APK payloads against this source tree; never read signing secrets."""
import argparse, hashlib, json, pathlib, re, struct, zipfile, xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
version_code=int(ET.parse(root/'app/src/main/AndroidManifest.xml').getroot().attrib['{http://schemas.android.com/apk/res/android}versionCode'])
parser=argparse.ArgumentParser()
parser.add_argument('--artifact-directory',type=pathlib.Path,default=root.parent)
parser.add_argument('--flavor',choices=['lite','offline'])
parser.add_argument('--build-log',type=pathlib.Path)
parser.add_argument('--build-directory',type=pathlib.Path)
args=parser.parse_args()
apk=args.artifact_directory/(f'inkvoy-{version}-{args.flavor}.apk' if args.flavor else f'deepseek-android-bridge-v{version}.apk')
def digest(stream):return hashlib.file_digest(stream,'sha256').hexdigest()
compared=[];native={}
with zipfile.ZipFile(apk) as archive:
    raw_names=[entry.orig_filename for entry in archive.infolist()]
    if any('\\' in name for name in raw_names):raise ValueError('Backslash in raw APK ZIP entry name; Android asset lookup would fail')
    if len(set(raw_names))!=len(raw_names):raise ValueError('Duplicate raw APK ZIP entry name')
    for directory,prefix in [(root/'app/src/main/assets','assets'),(root/'app/src/main/jniLibs','lib')]:
        for file in sorted(directory.rglob('*')):
            if not file.is_file():continue
            entry=prefix+'/'+file.relative_to(directory).as_posix()
            if args.flavor=='lite' and entry=='assets/runtime/debian-arm64.tar.gz':continue
            with archive.open(entry) as stream,file.open('rb') as original:
                if digest(stream)!=digest(original):raise ValueError('APK payload differs: '+entry)
            compared.append(entry)
            if prefix=='lib':
                data=archive.read(entry)
                if data[:5]!=b'\x7fELF\x02' or struct.unpack_from('<H',data,18)[0]!=183:raise ValueError('Native ABI differs')
                offset=struct.unpack_from('<Q',data,32)[0];size,count=struct.unpack_from('<HH',data,54);alignments=[]
                for i in range(count):
                    p=offset+i*size
                    if struct.unpack_from('<I',data,p)[0]==1:alignments.append(struct.unpack_from('<Q',data,p+48)[0])
                if not alignments or min(alignments)<16384:raise ValueError('Native ELF is not 16 KiB aligned')
                native[entry]={'sha256':hashlib.sha256(data).hexdigest(),'minLoadAlignment':min(alignments)}
    if not archive.read('classes.dex').startswith(b'dex\n'):raise ValueError('Missing real DEX')
    if args.flavor:
        image_entry='assets/runtime/debian-arm64.tar.gz'
        if args.flavor=='lite':
            if image_entry in archive.namelist():raise ValueError('Lightweight APK unexpectedly bundles the image')
        else:
            manifest=json.loads(archive.read('assets/runtime/manifest.json'))
            if archive.getinfo(image_entry).file_size!=manifest['compressedBytes']:raise ValueError('Runtime archive size differs from pinned manifest')
            with archive.open(image_entry) as stream:
                if digest(stream)!=manifest['sha256']:raise ValueError('Runtime archive digest differs from pinned manifest')
    dex_matches=None
    if args.build_directory:
        dex_files=list(args.build_directory.glob('dex-*/classes.dex'))
        if not dex_files:raise ValueError('Compiled DEX input missing')
        dex=max(dex_files,key=lambda p:p.stat().st_mtime)
        dex_matches=hashlib.sha256(archive.read('classes.dex')).hexdigest()==digest(dex.open('rb'))
        if not dex_matches:raise ValueError('Packaged DEX differs from this build')
log=(args.build_log or root/f'build/apk-{version}.log').read_text(encoding='utf8',errors='replace')
signer=re.search(r'certificate SHA-256 digest: ([0-9a-fA-F]+)',log)
expected='cc8f15b569d5e813c68d49f4fa17d19afbe6f7526ef5dbdade88e317116c2b59'
if not signer or signer[1].lower()!=expected:raise ValueError('Unexpected signing identity')
for text in [f"versionCode='{version_code}'", f"versionName='{version}'", "targetSdkVersion:'35'", "minSdkVersion:'26'"]:
    if text not in log:raise ValueError('APK metadata not verified: '+text)
report={'apk':apk.name,'flavor':args.flavor,'bytes':apk.stat().st_size,'sha256':digest(apk.open('rb')),'rawZipPathsPortable':True,'sourcePayloadsMatched':compared,'nativeLibraries':native,'compiledDexMatched':dex_matches,'runtimeImageBundled':args.flavor!='lite','signerSha256':expected,'sameSignerAsV1':True,'minSdk':26,'targetSdk':35,'versionCode':version_code,'androidDeviceVerified':False}
report_name=f"apk-payload-{args.flavor}-{version.replace('.','')}.json" if args.flavor else 'apk-payload.json'
(root/'verification'/report_name).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
