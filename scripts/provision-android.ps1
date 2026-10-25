param([string]$ToolsDirectory)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
if (-not $ToolsDirectory) { $ToolsDirectory = Join-Path $PSScriptRoot '..\..\..\work\android-toolchain' }
$androidToolsRoot = [IO.Path]::GetFullPath($ToolsDirectory)
New-Item -ItemType Directory -Force -Path $androidToolsRoot | Out-Null
$androidManifestPath = Join-Path $androidToolsRoot 'toolchain.json'
if (Test-Path -LiteralPath $androidManifestPath) {
    Get-Content -LiteralPath $androidManifestPath
    exit 0
}
function Get-AndroidArchive($url, $file, $expected, $algorithm) {
    $downloadPath = Join-Path $androidToolsRoot $file
    if (-not (Test-Path -LiteralPath $downloadPath)) {
        Write-Host ('Downloading ' + $file)
        Invoke-WebRequest -Uri $url -OutFile $downloadPath -TimeoutSec 600
    }
    if ((Get-FileHash -LiteralPath $downloadPath -Algorithm $algorithm).Hash.ToLowerInvariant() -ne $expected.ToLowerInvariant()) {
        throw ('Checksum mismatch: ' + $file)
    }
    return $downloadPath
}
$jdkMetadata = @(Invoke-RestMethod -Uri 'https://api.adoptium.net/v3/assets/latest/17/hotspot?architecture=x64&image_type=jdk&os=windows' -TimeoutSec 40)[0]
$jdkPackage = $jdkMetadata.binary.package
$jdkArchive = Get-AndroidArchive $jdkPackage.link $jdkPackage.name $jdkPackage.checksum 'SHA256'
$jdkDestination = Join-Path $androidToolsRoot 'jdk'
New-Item -ItemType Directory -Force -Path $jdkDestination | Out-Null
Expand-Archive -LiteralPath $jdkArchive -DestinationPath $jdkDestination -Force
$javaDirectory = @(Get-ChildItem -LiteralPath $jdkDestination -Directory)[0].FullName
Write-Output 'JDK ready'
[xml]$androidRepository = (Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/repository2-1.xml' -TimeoutSec 40).Content
$androidPackages = $androidRepository.SelectNodes("//*[local-name()='remotePackage']")
$downloads = @()
foreach ($packageId in @('platforms;android-35', 'build-tools;35.0.0', 'platform-tools')) {
    $packageNode = $androidPackages | Where-Object { $_.GetAttribute('path') -eq $packageId } | Select-Object -First 1
    if (-not $packageNode) { throw ('Missing SDK metadata: ' + $packageId) }
    $archiveNode = @($packageNode.archives.archive | Where-Object { -not $_.'host-os' -or $_.'host-os' -eq 'windows' })[0]
    $completeNode = $archiveNode.complete
    $archiveName = Split-Path -Leaf ([string]$completeNode.url)
    $sdkArchive = Get-AndroidArchive ('https://dl.google.com/android/repository/' + $completeNode.url) $archiveName ([string]$completeNode.checksum) 'SHA1'
    $sdkDestination = Join-Path $androidToolsRoot ($packageId.Replace(';', '-'))
    New-Item -ItemType Directory -Force -Path $sdkDestination | Out-Null
    Expand-Archive -LiteralPath $sdkArchive -DestinationPath $sdkDestination -Force
    $downloads += [pscustomobject]@{package=$packageId;destination=$sdkDestination;url=('https://dl.google.com/android/repository/' + $completeNode.url)}
    Write-Output ($packageId + ' ready')
}
$platformJar = Get-ChildItem -LiteralPath ($downloads | Where-Object package -eq 'platforms;android-35').destination -Filter 'android.jar' -Recurse | Select-Object -First 1
$aaptFile = Get-ChildItem -LiteralPath ($downloads | Where-Object package -eq 'build-tools;35.0.0').destination -Filter 'aapt2.exe' -Recurse | Select-Object -First 1
$adbFile = Get-ChildItem -LiteralPath ($downloads | Where-Object package -eq 'platform-tools').destination -Filter 'adb.exe' -Recurse | Select-Object -First 1
$androidToolchain = [pscustomobject]@{javaHome=$javaDirectory;buildTools=$aaptFile.Directory.FullName;androidJar=$platformJar.FullName;adb=$adbFile.FullName;jdkVersion=$jdkMetadata.version.openjdk_version;jdkUrl=$jdkPackage.link;jdkSha256=$jdkPackage.checksum;packages=$downloads}
$androidToolchain | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $androidManifestPath -Encoding utf8
$androidToolchain | ConvertTo-Json -Depth 5 -Compress
