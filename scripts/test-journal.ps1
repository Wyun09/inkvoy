param([string]$Toolchain,[string]$TestDependencies)
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $Toolchain){$Toolchain=Join-Path $project '../../work/android-toolchain/toolchain.json'}
if(-not $TestDependencies){$TestDependencies=Join-Path $project '../../work/runtime-sources'}
$config=Get-Content -LiteralPath $Toolchain -Raw | ConvertFrom-Json
$out=Join-Path $project ('build/journal-tests-'+(Get-Date -Format yyyyMMdd-HHmmss));New-Item -ItemType Directory -Force -Path $out | Out-Null
$deps=@('json.jar','sqlite-jdbc.jar','slf4j-api.jar','slf4j-nop.jar') | ForEach-Object {Join-Path $TestDependencies $_}
$classpath=($deps -join ';')+';'+$config.androidJar
$sources=@('app/src/main/java/io/github/deepseekbridge/ToolJournal.java','app/src/main/java/io/github/deepseekbridge/RuntimeAssets.java','app/src/main/java/io/github/deepseekbridge/RuntimeInstaller.java','test/host-stubs/android/system/Os.java','test/JournalSelfTest.java') | ForEach-Object {Join-Path $project $_}
$sources+=Get-ChildItem -LiteralPath (Join-Path $project 'test/journal-stubs') -Recurse -Filter '*.java' | ForEach-Object FullName
& (Join-Path $config.javaHome 'bin/javac.exe') --release 8 -encoding UTF-8 -cp $classpath -d $out @sources
if($LASTEXITCODE -ne 0){throw 'Journal test compilation failed'}
& (Join-Path $config.javaHome 'bin/java.exe') -cp ($out+';'+$classpath) JournalSelfTest
if($LASTEXITCODE -ne 0){throw 'Journal SQL tests failed'}
