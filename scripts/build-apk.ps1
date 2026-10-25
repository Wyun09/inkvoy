param([string]$Toolchain, [string]$SigningDirectory, [switch]$CompileOnly, [string]$BuildDirectory, [string]$ArtifactDirectory)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$androidProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseVersion = (Get-Content -LiteralPath (Join-Path $androidProject 'package.json') -Raw | ConvertFrom-Json).version
if(-not $CompileOnly){
    $runtimeManifest=Join-Path $androidProject 'app/src/main/assets/runtime/manifest.json'
    $runtimeArchive=Join-Path $androidProject 'app/src/main/assets/runtime/debian-arm64.tar.gz'
    if(-not(Test-Path -LiteralPath $runtimeManifest) -or -not(Test-Path -LiteralPath $runtimeArchive)){throw 'The offline Debian image is required for a distributable v2 APK. Build the runtime image first; use -CompileOnly for development compilation.'}
    $runtimeInfo=Get-Content -LiteralPath $runtimeManifest -Raw | ConvertFrom-Json
    if((Get-Item -LiteralPath $runtimeArchive).Length -ne $runtimeInfo.compressedBytes -or (Get-FileHash -LiteralPath $runtimeArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $runtimeInfo.sha256){throw 'Offline runtime image verification failed.'}
}
if (-not $Toolchain) { $Toolchain = Join-Path $androidProject '..\..\work\android-toolchain\toolchain.json' }
if (-not $SigningDirectory) { $SigningDirectory = Join-Path $androidProject '..\..\work\android-signing' }
$toolchainConfig = Get-Content -LiteralPath $Toolchain -Raw | ConvertFrom-Json
$javaTool = Join-Path $toolchainConfig.javaHome 'bin\java.exe'
$javacTool = Join-Path $toolchainConfig.javaHome 'bin\javac.exe'
$jarTool = Join-Path $toolchainConfig.javaHome 'bin\jar.exe'
$keyTool = Join-Path $toolchainConfig.javaHome 'bin\keytool.exe'
$buildPath = if($BuildDirectory){[IO.Path]::GetFullPath($BuildDirectory)}else{Join-Path $androidProject 'build'}
$artifactPath = if($ArtifactDirectory){[IO.Path]::GetFullPath($ArtifactDirectory)}else{[IO.Path]::GetFullPath((Join-Path $androidProject '..'))}
$classesPath = Join-Path $buildPath ('classes-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$dexPath = Join-Path $buildPath ('dex-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $buildPath,$classesPath,$dexPath,$SigningDirectory,$artifactPath | Out-Null
function Assert-AndroidExit($stage) { if ($LASTEXITCODE -ne 0) { throw ('Android build failed: ' + $stage) } }
Push-Location -LiteralPath $androidProject
try {
    & npm.cmd run build:assets; Assert-AndroidExit 'JavaScript assets'
    $aapt = Join-Path $toolchainConfig.buildTools 'aapt2.exe'
    $resourceZip = Join-Path $buildPath 'resources.zip'
    & $aapt compile --dir 'app\src\main\res' -o $resourceZip; Assert-AndroidExit 'compile resources'
    $resourceApk = Join-Path $buildPath 'resources.apk'
    & $aapt link -o $resourceApk -I $toolchainConfig.androidJar --manifest 'app\src\main\AndroidManifest.xml' -A 'app\src\main\assets' $resourceZip; Assert-AndroidExit 'link resources'
    & py.exe 'scripts\normalize-apk-paths.py' $resourceApk --build-root $buildPath; Assert-AndroidExit 'portable APK asset paths'
    $sources = @(Get-ChildItem -LiteralPath 'app\src\main\java' -Filter '*.java' -Recurse | ForEach-Object FullName)
    & $javacTool --release 8 -encoding UTF-8 -classpath $toolchainConfig.androidJar -d $classesPath @sources; Assert-AndroidExit 'javac'
    $classFiles = @(Get-ChildItem -LiteralPath $classesPath -Filter '*.class' -Recurse | ForEach-Object FullName)
    & $javaTool -cp (Join-Path $toolchainConfig.buildTools 'lib\d8.jar') com.android.tools.r8.D8 --min-api 26 --lib $toolchainConfig.androidJar --output $dexPath @classFiles; Assert-AndroidExit 'D8'
    if($CompileOnly){Write-Output 'Java and DEX compilation passed. No distributable APK was created.';return}
    $unsigned = Join-Path $buildPath 'unsigned.apk'
    Copy-Item -LiteralPath $resourceApk -Destination $unsigned -Force
    & $jarTool uf $unsigned -C $dexPath 'classes.dex'; Assert-AndroidExit 'APK assembly'
    $nativeSource = Join-Path $androidProject 'app\src\main\jniLibs'
    if (Test-Path -LiteralPath $nativeSource) {
        $nativePackage = Join-Path $buildPath 'native-package'
        $nativeLib = Join-Path $nativePackage 'lib'
        New-Item -ItemType Directory -Force -Path $nativeLib | Out-Null
        Get-ChildItem -LiteralPath $nativeSource -Directory | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $nativeLib -Recurse -Force }
        & $jarTool uf $unsigned -C $nativePackage 'lib'; Assert-AndroidExit 'native execution libraries'
    }
    $aligned = Join-Path $buildPath 'aligned.apk'
    & (Join-Path $toolchainConfig.buildTools 'zipalign.exe') -f -p 4 $unsigned $aligned; Assert-AndroidExit 'zipalign'
    $signingFile = Join-Path $SigningDirectory 'signing.json'
    $keystore = Join-Path $SigningDirectory 'android-bridge-test.jks'
    if (-not (Test-Path -LiteralPath $signingFile)) {
        $signing = [pscustomobject]@{password=[Guid]::NewGuid().ToString('N');alias='android-bridge-test'}
        $signing | ConvertTo-Json | Set-Content -LiteralPath $signingFile -Encoding utf8
    }
    $signing = Get-Content -LiteralPath $signingFile -Raw | ConvertFrom-Json
    if (-not (Test-Path -LiteralPath $keystore)) {
        & $keyTool -genkeypair -keystore $keystore -alias $signing.alias -storepass $signing.password -keypass $signing.password -keyalg RSA -keysize 3072 -validity 3650 -dname 'CN=DeepSeek Android Bridge Test Build'; Assert-AndroidExit 'test signing identity'
    }
    $artifact = Join-Path $artifactPath ('deepseek-android-bridge-v' + $releaseVersion + '.apk')
    if(Test-Path -LiteralPath $artifact){throw 'Preserve the existing release APK; use a new version or artifact directory.'}
    & $javaTool -jar (Join-Path $toolchainConfig.buildTools 'lib\apksigner.jar') sign --ks $keystore --ks-key-alias $signing.alias --ks-pass ('pass:' + $signing.password) --key-pass ('pass:' + $signing.password) --out $artifact $aligned; Assert-AndroidExit 'APK signing'
    & $javaTool -jar (Join-Path $toolchainConfig.buildTools 'lib\apksigner.jar') verify --verbose --print-certs $artifact; Assert-AndroidExit 'signature verification'
    & $aapt dump badging $artifact | Select-Object -First 14; Assert-AndroidExit 'APK metadata'
    [pscustomobject]@{apk=[IO.Path]::GetFullPath($artifact);bytes=(Get-Item -LiteralPath $artifact).Length;sha256=(Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash;minSdk=26;targetSdk=35;version=$releaseVersion;signing='local test identity'} | ConvertTo-Json -Compress
}
finally { Pop-Location }
