param([string]$Toolchain)
$ErrorActionPreference = 'Stop'
$androidProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $Toolchain) { $Toolchain = Join-Path $androidProject '..\..\work\android-toolchain\toolchain.json' }
$toolchainConfig = Get-Content -LiteralPath $Toolchain -Raw | ConvertFrom-Json
$testClasses = Join-Path $androidProject ('build\storage-tests-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $testClasses | Out-Null
& (Join-Path $toolchainConfig.javaHome 'bin\javac.exe') --release 8 -encoding UTF-8 -d $testClasses (Join-Path $androidProject 'app\src\main\java\io\github\deepseekbridge\EncryptedStateStore.java') (Join-Path $androidProject 'test\StorageSelfTest.java')
if ($LASTEXITCODE -ne 0) { throw 'Storage test compilation failed.' }
& (Join-Path $toolchainConfig.javaHome 'bin\java.exe') -cp $testClasses StorageSelfTest
if ($LASTEXITCODE -ne 0) { throw 'Storage tests failed.' }
