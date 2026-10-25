"""Extract the two AndroidX test AAR class jars for the Maven JVM test runner."""
import hashlib,io,json,pathlib,urllib.request,zipfile
root=pathlib.Path(__file__).resolve().parents[1]/'test/android-runtime/lib';root.mkdir(parents=True,exist_ok=True)
items=[('monitor','https://dl.google.com/dl/android/maven2/androidx/test/monitor/1.8.0/monitor-1.8.0.aar'),('espresso','https://dl.google.com/dl/android/maven2/androidx/test/espresso/espresso-idling-resource/3.7.0/espresso-idling-resource-3.7.0.aar')]
records=[]
for name,url in items:
    target=root/(name+'.jar')
    if target.exists():continue
    with urllib.request.urlopen(url,timeout=90) as response:blob=response.read()
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:target.write_bytes(archive.read('classes.jar'))
    records.append(dict(name=name,url=url,aarSha256=hashlib.sha256(blob).hexdigest(),jarSha256=hashlib.sha256(target.read_bytes()).hexdigest()))
    print('Prepared AndroidX test '+name)
if records:(root/'origins.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
