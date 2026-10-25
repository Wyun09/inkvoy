param([string]$Toolchain)
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $Toolchain){$Toolchain=Join-Path $project '../../work/android-toolchain/toolchain.json'}
$config=Get-Content -LiteralPath $Toolchain -Raw | ConvertFrom-Json
$out=Join-Path $project 'build/runtime-fixtures'
$classes=Join-Path $out 'classes';$dex=Join-Path $out 'dex'
New-Item -ItemType Directory -Force -Path $out,$classes,$dex | Out-Null
& (Join-Path $config.javaHome 'bin/javac.exe') --release 8 -encoding UTF-8 -d $classes (Join-Path $project 'test/fixtures/StudioFixture.java')
if($LASTEXITCODE -ne 0){throw 'Fixture javac failed'}
& (Join-Path $config.javaHome 'bin/jar.exe') cf (Join-Path $out 'sample.jar') -C $classes 'studio'
& (Join-Path $config.javaHome 'bin/java.exe') -cp (Join-Path $config.buildTools 'lib/d8.jar') com.android.tools.r8.D8 --min-api 26 --lib $config.androidJar --output $dex (Join-Path $classes 'studio/fixture/StudioFixture.class')
if($LASTEXITCODE -ne 0){throw 'Fixture D8 failed'}
$manifest='<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="studio.fixture"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35"/><application android:label="Studio Fixture"/></manifest>'
Set-Content -LiteralPath (Join-Path $out 'AndroidManifest.xml') -Value $manifest -Encoding utf8
& (Join-Path $config.buildTools 'aapt2.exe') link --manifest (Join-Path $out 'AndroidManifest.xml') -I $config.androidJar -o (Join-Path $out 'sample.apk')
if($LASTEXITCODE -ne 0){throw 'Fixture manifest failed'}
& (Join-Path $config.javaHome 'bin/jar.exe') uf (Join-Path $out 'sample.apk') -C $dex 'classes.dex'
Copy-Item -LiteralPath (Join-Path $dex 'classes.dex') -Destination (Join-Path $out 'sample.dex') -Force
Write-Output ('Created owned JAR/DEX/APK fixtures in '+$out)
