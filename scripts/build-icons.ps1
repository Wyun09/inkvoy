$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
# Packaging only: resize the generated artwork without redrawing its design.
Add-Type -AssemblyName System.Drawing
$iconRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$iconSource = Join-Path $iconRoot 'branding\logo-source.png'
$iconImage = [Drawing.Image]::FromFile($iconSource)
try {
    $iconTargets = @(
        @{path='app\src\main\res\drawable-nodpi\ic_launcher_art.png';size=512},
        @{path='js\ui\logo.png';size=256}
    )
    foreach ($density in @(@{name='mdpi';size=48},@{name='hdpi';size=72},@{name='xhdpi';size=96},@{name='xxhdpi';size=144},@{name='xxxhdpi';size=192})) {
        $iconTargets += @{path=('app\src\main\res\mipmap-' + $density.name + '\ic_launcher.png');size=$density.size}
    }
    foreach ($target in $iconTargets) {
        $iconPath = Join-Path $iconRoot $target.path
        New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($iconPath)) | Out-Null
        $iconBitmap = [Drawing.Bitmap]::new($target.size, $target.size)
        $iconGraphics = [Drawing.Graphics]::FromImage($iconBitmap)
        try {
            $iconGraphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
            $iconGraphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $iconGraphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $iconGraphics.DrawImage($iconImage, 0, 0, $target.size, $target.size)
            $iconBitmap.Save($iconPath, [Drawing.Imaging.ImageFormat]::Png)
        } finally { $iconGraphics.Dispose(); $iconBitmap.Dispose() }
    }
} finally { $iconImage.Dispose() }
Write-Output 'Packaged generated logo into launcher densities and local UI asset.'
