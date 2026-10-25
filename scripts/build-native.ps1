param([string]$NdkDirectory)
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $NdkDirectory){$NdkDirectory=[IO.Path]::GetFullPath((Join-Path $projectRoot '../../work/android-ndk/android-ndk-r28c'))}
$clang=Join-Path $NdkDirectory 'toolchains/llvm/prebuilt/windows-x86_64/bin/clang.exe'
if(-not(Test-Path -LiteralPath $clang)){throw 'Set -NdkDirectory to an installed Android NDK r28 or newer.'}
$output=Join-Path $projectRoot 'app/src/main/jniLibs/arm64-v8a/libtermux.so'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $output) | Out-Null
& $clang '--target=aarch64-linux-android26' '-shared' '-fPIC' '-Os' '-Wl,-z,max-page-size=16384' '-Wl,-z,common-page-size=16384' '-Wl,-soname,libtermux.so' (Join-Path $projectRoot 'app/src/main/cpp/termux.c') (Join-Path $projectRoot 'app/src/main/cpp/studio.c') '-o' $output
if($LASTEXITCODE -ne 0){throw 'Native PTY compilation failed'}
Get-FileHash -LiteralPath $output -Algorithm SHA256
