"""Build-time downloads only; never invoked by the Android application."""
import hashlib, json, pathlib, sys, urllib.request
directory = pathlib.Path(sys.argv[1]).resolve()
directory.mkdir(parents=True, exist_ok=True)
for item in json.loads(pathlib.Path(__file__).with_name('artifacts.json').read_text()):
    destination = directory / item['name']
    if not destination.exists():
        temporary = destination.with_suffix(destination.suffix + '.partial')
        request = urllib.request.Request(item['url'], headers={'User-Agent': 'DeepSeek-Studio-build/2.0'})
        with urllib.request.urlopen(request, timeout=90) as response, temporary.open('wb') as output:
            while data := response.read(1024 * 1024):
                output.write(data)
        temporary.replace(destination)
    actual = hashlib.file_digest(destination.open('rb'), 'sha256').hexdigest()
    if actual != item['sha256']:
        raise SystemExit('SHA256 mismatch: ' + item['name'])
    print('Verified', item['name'])
