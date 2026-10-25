"""Create and verify a source ZIP from a fixed public-file allowlist."""
import argparse, hashlib, json, pathlib, re, zipfile
root=pathlib.Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
parser=argparse.ArgumentParser();parser.add_argument('--artifact-directory',type=pathlib.Path,default=root.parent);args=parser.parse_args()
destination=args.artifact_directory.resolve();destination.mkdir(parents=True,exist_ok=True)
output=destination/f'deepseek-android-bridge-v{version}-source.zip'
if output.exists():raise SystemExit('Preserve the existing release ZIP')
files=[]
for name in ['app','js','scripts','test','preview','branding','third_party','verification']:
    files.extend(p for p in (root/name).rglob('*') if p.is_file())
for name in ['.gitignore','LICENSE','package.json','package-lock.json','README.md','CLAUDE_CODE.md','VERIFICATION.md','CORE_PROVENANCE.json','THIRD_PARTY_NOTICES.md','release.json','DESIGN_4.0.md','DESIGN_5.0.md','DESIGN_5.1.md','HARNESS_PARITY.md','GITHUB_MIGRATION.md','GITHUB_REPOSITORY_PROMPT.md']:files.append(root/name)
fix=root/f'FIX_{version}.md'
if fix.exists():files.append(fix)
# Ship only the final version's documented previews; keep rejected local drafts intact.
files=[p for p in files if not (p.relative_to(root).parts[:2]==('preview','4.0.0') and p.suffix=='.png' and not p.name.startswith(('research-','interaction-')))]
files=[p for p in files if not (p.relative_to(root).parts[:2]==('preview','5.0.0') and not p.name.startswith('studio-'))]
for file in files:
    if file.suffix in ('.jks','.keystore') or file.name in ('signing.json','.env','id_rsa','id_ed25519') or any(p in ('node_modules','.git','.browser-profile') for p in file.relative_to(root).parts):raise ValueError('Private path in release')
    if not file.is_file():raise ValueError('Missing release file: '+file.name)
    if file.suffix in ('.java','.c','.js','.mjs','.json','.md','.ps1','.py','.txt','.log') and 'third_party' not in file.relative_to(root).parts:
        text=file.read_text(encoding='utf8',errors='ignore')
        if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|android-[a-f0-9]{48,}',text):raise ValueError('Possible private material in '+str(file.relative_to(root)))
def digest(stream):return hashlib.file_digest(stream,'sha256').hexdigest()
manifest={};temporary=output.with_suffix('.zip.partial')
with zipfile.ZipFile(temporary,'w',allowZip64=True) as archive:
    for file in sorted(files):
        relative=file.relative_to(root).as_posix();manifest[relative]=digest(file.open('rb'))
        stored=file.suffix in ('.gz','.xz','.bz2','.zip','.jar','.png','.jpg','.deb')
        archive.write(file,'deepseek-android-studio/'+relative,compress_type=zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED,compresslevel=6)
    archive.writestr('deepseek-android-studio/SOURCE_MANIFEST.json',json.dumps(manifest,indent=2)+'\n',compress_type=zipfile.ZIP_DEFLATED)
with zipfile.ZipFile(temporary) as archive:
    for relative,expected in manifest.items():
        with archive.open('deepseek-android-studio/'+relative) as stream:
            if digest(stream)!=expected:raise ValueError('Source ZIP verification failed: '+relative)
    if len(archive.infolist())!=len(manifest)+1:raise ValueError('Unexpected ZIP entries')
temporary.replace(output)
apk=destination/f'deepseek-android-bridge-v{version}.apk'
hashes={p.name:digest(p.open('rb')) for p in (apk,output)}
(destination/f'deepseek-android-bridge-v{version}-SHA256SUMS.txt').write_text(''.join(h+'  '+n+'\n' for n,h in hashes.items()))
report={'sourceZip':output.name,'sourceBytes':output.stat().st_size,'sourceFiles':len(manifest),'allSourceEntryHashesMatch':True,'privatePaths':0,'hashes':hashes}
(destination/f'deepseek-android-bridge-v{version}-artifacts.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
