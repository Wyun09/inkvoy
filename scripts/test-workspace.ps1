param([string]$Toolchain,[string]$JsonJar)
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $Toolchain){$Toolchain=Join-Path $project '../../work/android-toolchain/toolchain.json'}
if(-not $JsonJar){$JsonJar=Join-Path $project '../../work/runtime-sources/json.jar'}
$config=Get-Content -LiteralPath $Toolchain -Raw | ConvertFrom-Json
$out=Join-Path $project ('build/workspace-tests-'+(Get-Date -Format yyyyMMdd-HHmmss))
New-Item -ItemType Directory -Force -Path $out | Out-Null
$sources=@('app/src/main/java/io/github/deepseekbridge/ProjectFiles.java','app/src/main/java/io/github/deepseekbridge/RuntimeAssets.java','app/src/main/java/io/github/deepseekbridge/RuntimeInstaller.java','test/host-stubs/android/system/Os.java','test/WorkspaceSelfTest.java') | ForEach-Object {Join-Path $project $_}
& (Join-Path $config.javaHome 'bin/javac.exe') --release 8 -encoding UTF-8 -cp ($JsonJar+';'+$config.androidJar) -d $out @sources
if($LASTEXITCODE -ne 0){throw 'Workspace test compilation failed'}
& (Join-Path $config.javaHome 'bin/java.exe') -cp ($out+';'+$JsonJar+';'+$config.androidJar) io.github.deepseekbridge.WorkspaceSelfTest
if($LASTEXITCODE -ne 0){throw 'Workspace host tests failed'}
