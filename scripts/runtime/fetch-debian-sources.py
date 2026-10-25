"""Download the exact Debian source archives named in packages.tsv.

Build/distribution helper, not a phone-side installer. Downloads all source
packages, including permissive dependencies, and verifies the Sources SHA256.
"""
import concurrent.futures, hashlib, json, lzma, pathlib, sys, urllib.request
packages, output = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
index_file = output / 'Sources.xz'
base = 'https://deb.debian.org/debian/'
def download(url, path, sha=None, size=None):
    if path.is_file() and (size is None or path.stat().st_size == size):
        with path.open('rb') as f: actual=hashlib.file_digest(f,'sha256').hexdigest()
        if sha is None or sha == actual:return actual
    temporary = path.with_name(path.name + '.partial')
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent':'DeepSeek-Studio-source/2.0'})
            digest=hashlib.sha256(); written=0
            with urllib.request.urlopen(request,timeout=120) as response, temporary.open('wb') as f:
                while data:=response.read(1024*1024):f.write(data);digest.update(data);written+=len(data)
            if sha and digest.hexdigest()!=sha:raise ValueError('Source SHA256 mismatch: '+path.name)
            if size is not None and size!=written:raise ValueError('Source size mismatch: '+path.name)
            temporary.replace(path);return digest.hexdigest()
        except Exception:
            if attempt==2:raise
download(base+'dists/trixie/main/source/Sources.xz',index_file)
needed=set()
for row in packages.read_text().splitlines():
    fields=row.split('\t')
    if len(fields)==5 and fields[0]!='radare2':needed.add((fields[3],fields[4]))
records={}
with lzma.open(index_file,'rt',encoding='utf8') as stream:
    record={};key=None
    for line in stream:
        if line.strip()=='':
            identity=(record.get('Package'),record.get('Version'))
            if identity in needed:records[identity]=record
            record={};key=None
        elif line[0].isspace() and key:record[key]+='\n'+line.strip()
        else:
            key,_,value=line.partition(':');record[key]=value.strip()
missing=needed-records.keys()
if missing:raise SystemExit('Exact sources missing from current index: '+repr(sorted(missing)))
jobs={}
for identity,record in sorted(records.items()):
    for line in record['Checksums-Sha256'].strip().splitlines():
        sha,size,name=line.split();key=record['Directory']+'/'+name
        jobs[key]={'name':name,'url':base+key,'sha256':sha,'bytes':int(size)}
manifest={'index':base+'dists/trixie/main/source/Sources.xz','packages':[{'name':n,'version':v} for n,v in sorted(needed)],'files':list(jobs.values())}
(output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
def job(item):
    result=download(item['url'],output/item['name'],item['sha256'],item['bytes'])
    print('Verified '+item['name'],flush=True);return result
print(f'Downloading {len(needed)} source packages, {len(jobs)} files, {sum(j["bytes"] for j in jobs.values())} bytes',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(job,jobs.values()))
print('DEBIAN_SOURCES_READY',flush=True)
