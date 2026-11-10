$ErrorActionPreference = 'Stop'
$taskBackend = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskManifest = Get-Content -LiteralPath (Join-Path $taskBackend 'database/runtime/operations-toolchain.json') -Raw | ConvertFrom-Json
$taskTools = Join-Path $taskBackend '.local/tools'
New-Item -ItemType Directory -Force -Path $taskTools | Out-Null
$taskZip = Join-Path $taskTools 'postgresql-16.15.zip'
if (-not (Test-Path -LiteralPath $taskZip)) { Invoke-WebRequest -Uri $taskManifest.sourceUrl -OutFile $taskZip }
if ((Get-FileHash -LiteralPath $taskZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskManifest.archiveSha256) { throw 'PG_CLIENT_ARCHIVE_PIN_MISMATCH' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskArchive = [System.IO.Compression.ZipFile]::OpenRead($taskZip)
$taskTarget = Join-Path $taskTools 'postgres-bin'
New-Item -ItemType Directory -Force -Path $taskTarget | Out-Null
try {
    foreach ($taskEntry in $taskArchive.Entries) {
        if ($taskEntry.FullName -match '^pgsql/bin/([^/]+\.dll|pg_dump\.exe|pg_restore\.exe)$') {
            $taskFile = Join-Path $taskTarget ([System.IO.Path]::GetFileName($taskEntry.FullName))
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($taskEntry, $taskFile, $true)
        }
    }
} finally { $taskArchive.Dispose() }
foreach ($taskPin in $taskManifest.files.PSObject.Properties) {
    if ((Get-FileHash -LiteralPath (Join-Path $taskTarget $taskPin.Name) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskPin.Value) { throw 'PG_CLIENT_BINARY_PIN_MISMATCH' }
}
& (Join-Path $taskTarget 'pg_dump.exe') --version
& (Join-Path $taskTarget 'pg_restore.exe') --version
