param([Parameter(Mandatory=$true)][string]$ImagePath)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await-Result($Operation, $Type) {
    $task = $asTask.MakeGenericMethod($Type).Invoke($null, @($Operation))
    if (-not $task.Wait(8000)) { throw 'OCR_TIMEOUT' }
    return $task.Result
}
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $engine) { throw 'OCR_UNAVAILABLE' }
function Read-OcrText([string]$Path) {
 $stream = $null; $bitmap = $null
 try {
    $file = Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Path)) ([Windows.Storage.StorageFile])
    $stream = Await-Result ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await-Result ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    if ($decoder.PixelWidth -gt 4096 -or $decoder.PixelHeight -gt 4096 -or ([long]$decoder.PixelWidth * $decoder.PixelHeight) -gt 12000000) { throw 'IMAGE_DIMENSIONS' }
    $bitmap = Await-Result ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result = Await-Result ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    $lines = @($result.Lines | ForEach-Object { $_.Text })
    return ($lines -join "`n")
 } finally {
    if ($null -ne $bitmap) { $bitmap.Dispose() }
    if ($null -ne $stream) { $stream.Dispose() }
 }
}
$original = Read-OcrText $ImagePath
$processedPath = Join-Path ([IO.Path]::GetTempPath()) ('finweave-contrast-' + [guid]::NewGuid().ToString('N') + '.png')
$source = $null; $processed = $null; $graphics = $null; $attributes = $null
try {
 Add-Type -AssemblyName System.Drawing
 $source = [Drawing.Bitmap]::new($ImagePath)
 $brightness = 0.0
 for ($x=0; $x -lt 8; $x++) { for ($y=0; $y -lt 8; $y++) { $brightness += $source.GetPixel([int](($x+0.5)*$source.Width/8),[int](($y+0.5)*$source.Height/8)).GetBrightness() } }
 $gain = 1.6; $offset = -0.2
 if ($brightness/64 -lt 0.45) { $gain = -1.6; $offset = 1.2 }
 $matrix = [Drawing.Imaging.ColorMatrix]::new()
 $matrix.Matrix00 = 0.299*$gain; $matrix.Matrix01 = 0.299*$gain; $matrix.Matrix02 = 0.299*$gain
 $matrix.Matrix10 = 0.587*$gain; $matrix.Matrix11 = 0.587*$gain; $matrix.Matrix12 = 0.587*$gain
 $matrix.Matrix20 = 0.114*$gain; $matrix.Matrix21 = 0.114*$gain; $matrix.Matrix22 = 0.114*$gain
 $matrix.Matrix40 = $offset; $matrix.Matrix41 = $offset; $matrix.Matrix42 = $offset
 $processed = [Drawing.Bitmap]::new($source.Width,$source.Height)
 $graphics = [Drawing.Graphics]::FromImage($processed)
 $attributes = [Drawing.Imaging.ImageAttributes]::new(); $attributes.SetColorMatrix($matrix)
 $rect = [Drawing.Rectangle]::new(0,0,$source.Width,$source.Height)
 $graphics.DrawImage($source,$rect,0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel,$attributes)
 $processed.Save($processedPath,[Drawing.Imaging.ImageFormat]::Png)
 $contrast = Read-OcrText $processedPath
 @{ text=$original; alternatives=@($contrast); language=$engine.RecognizerLanguage.LanguageTag; engine='windows-ocr' } | ConvertTo-Json -Compress
} finally {
 if ($null -ne $attributes) { $attributes.Dispose() }; if ($null -ne $graphics) { $graphics.Dispose() }
 if ($null -ne $processed) { $processed.Dispose() }; if ($null -ne $source) { $source.Dispose() }
 if (Test-Path -LiteralPath $processedPath) { Remove-Item -LiteralPath $processedPath }
}
