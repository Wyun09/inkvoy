"""Normalize Windows aapt2 ZIP entry names before DEX assembly/alignment/signing."""
import argparse, pathlib, shutil, zipfile

def normalize(apk):
    temporary=apk.with_suffix('.normalized.apk')
    with zipfile.ZipFile(apk) as source:
        if any(entry.orig_filename.upper().startswith('META-INF/') and entry.orig_filename.upper().endswith(('.SF','.RSA','.EC','.DSA')) for entry in source.infolist()):raise ValueError('Refuse to rewrite a signed package')
        names=[entry.orig_filename.replace('\\','/') for entry in source.infolist()]
        if len(set(names))!=len(names):raise ValueError('Normalized APK entries collide')
        if any(name.startswith('/') or '..' in name.split('/') or '\x00' in name for name in names):raise ValueError('Unsafe APK entry')
        changed=sum(entry.orig_filename!=name for entry,name in zip(source.infolist(),names))
        if not changed:return 0
        with zipfile.ZipFile(temporary,'w',allowZip64=True) as target:
            for entry,name in zip(source.infolist(),names):
                clean=zipfile.ZipInfo(name,entry.date_time)
                for attribute in ('compress_type','create_system','create_version','extract_version','external_attr','internal_attr','comment'):
                    setattr(clean,attribute,getattr(entry,attribute))
                clean.file_size=entry.file_size
                with source.open(entry) as src,target.open(clean,'w',force_zip64=entry.file_size>=2**31) as dst:
                    shutil.copyfileobj(src,dst,1024*1024)
    temporary.replace(apk)
    with zipfile.ZipFile(apk) as archive:
        if any('\\' in entry.orig_filename for entry in archive.infolist()):raise ValueError('APK paths were not normalized')
    return changed

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('apk',type=pathlib.Path);parser.add_argument('--build-root',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]/'build');args=parser.parse_args()
    apk=args.apk.resolve()
    build=args.build_root.resolve()
    if not apk.is_relative_to(build.resolve()) or apk.suffix!='.apk':raise SystemExit('Only unsigned build intermediates may be normalized')
    print(f'Normalized {normalize(apk)} raw ZIP entry paths: {apk.name}')
