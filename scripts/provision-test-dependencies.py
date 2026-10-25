"""Optional JVM test dependencies; none are packaged in the Android APK."""
import hashlib, json, pathlib, sys, urllib.request
directory=pathlib.Path(sys.argv[1]).resolve();directory.mkdir(parents=True,exist_ok=True)
for item in json.loads(pathlib.Path(__file__).with_name('test-dependencies.json').read_text()):
    file=directory/item['name']
    if not file.is_file():
        with urllib.request.urlopen(item['url'],timeout=90) as response:file.write_bytes(response.read())
    with file.open('rb') as stream:actual=hashlib.file_digest(stream,'sha256').hexdigest()
    if actual!=item['sha256']:raise ValueError('Test dependency hash mismatch: '+item['name'])
    print('Verified '+item['name'])
