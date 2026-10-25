"""Reproduce Android launchers from pinned Termux ARM64 Debian packages.

PRoot and its loader are executable files installed through Android's native
library extractor. The talloc NEEDED/SONAME change is an equal-size string
replacement; no machine code is changed. Build libtermux.so separately with
scripts/build-native.ps1 and NDK r28c.
"""
import hashlib, io, json, pathlib, struct, sys, tarfile, urllib.request
project=pathlib.Path(__file__).resolve().parents[2]
cache=pathlib.Path(sys.argv[1]).resolve();cache.mkdir(parents=True,exist_ok=True)
target=project/'app/src/main/jniLibs/arm64-v8a';target.mkdir(parents=True,exist_ok=True)
packages=[
 ('proot','5.1.107.96','p/proot','8199dca06dccb693ec09fb1759e3e1ad08b4863f0c11c612f89c20bd9ecdc1a0',{'bin/proot':'libproot.so','libexec/proot/loader':'libproot_loader.so'}),
 ('libtalloc','2.5.0','libt/libtalloc','556591f43bb773ad8777e1a29522640866a55f95dab71914418b94a8c58ad5a7',{'lib/libtalloc.so.2.5.0':'libtalloc.so'}),
 ('libandroid-shmem','0.7','liba/libandroid-shmem','0da3a24d558b93c92bcf8d611e0826a99ff96e396b148e6cdf33b47c47c57ff6',{'lib/libandroid-shmem.so':'libandroid-shmem.so'})]
def ar_data(blob):
    if blob[:8]!=b'!<arch>\n':raise ValueError('Invalid Debian archive')
    offset=8
    while offset+60<=len(blob):
        header=blob[offset:offset+60];size=int(header[48:58]);name=header[:16].decode().strip().rstrip('/');offset+=60
        if name.startswith('data.tar'):return blob[offset:offset+size]
        offset+=size+(size%2)
    raise ValueError('Missing Debian data archive')
def elf_alignment(blob):
    if blob[:5]!=b'\x7fELF\x02' or struct.unpack_from('<H',blob,18)[0]!=183:raise ValueError('Expected ARM64 ELF')
    offset=struct.unpack_from('<Q',blob,32)[0];size,count=struct.unpack_from('<HH',blob,54)
    for i in range(count):
        p=offset+i*size
        if struct.unpack_from('<I',blob,p)[0]==1:
            alignment=struct.unpack_from('<Q',blob,p+48)[0]
            if alignment<16384:raise ValueError('ELF needs 16 KiB load segment alignment')
records=[]
for name,version,folder,sha,mapping in packages:
    filename=f'{name}_{version}_aarch64.deb';url=f'https://packages.termux.dev/apt/termux-main/pool/main/{folder}/{filename}'
    file=cache/(name+'.deb')
    if not file.exists():
        with urllib.request.urlopen(url,timeout=90) as response:file.write_bytes(response.read())
    blob=file.read_bytes()
    if hashlib.sha256(blob).hexdigest()!=sha:raise ValueError('Pinned package mismatch: '+name)
    outputs=[]
    with tarfile.open(fileobj=io.BytesIO(ar_data(blob)),mode='r:*') as archive:
        members={m.name.lstrip('./'):m for m in archive.getmembers()}
        for source,output in mapping.items():
            full='data/data/com.termux/files/usr/'+source
            data=archive.extractfile(members[full]).read();original=hashlib.sha256(data).hexdigest()
            changed=data.count(b'libtalloc.so.2\0')
            data=data.replace(b'libtalloc.so.2\0',b'libtalloc.so\0\0\0')
            elf_alignment(data);(target/output).write_bytes(data)
            outputs.append({'name':output,'originalSha256':original,'sha256':hashlib.sha256(data).hexdigest(),'tallocStringsReplaced':changed,'loadAlignmentMin':16384})
    records.append({'package':name,'version':version,'url':url,'sha256':sha,'outputs':outputs})
(project/'third_party/native-launchers.json').write_text(json.dumps(records,indent=2)+'\n')
print('Prepared and verified ARM64 / 16 KiB native launchers')
