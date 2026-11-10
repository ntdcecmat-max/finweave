param([switch]$Restart)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $taskRoot
$taskState = Get-Content -LiteralPath '.local/runtime-state.json' -Raw | ConvertFrom-Json
$taskDirectory = [IO.Path]::GetFullPath($taskState.dir)
if (-not $taskDirectory.StartsWith($taskRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'LOCAL_STATE_OUTSIDE_WORKSPACE' }
node scripts/local-runtime.ts migrate
if ($LASTEXITCODE -ne 0) { throw 'BUSINESS_MIGRATION_FAILED' }
$taskServices = @{}
if (Test-Path -LiteralPath '.local/business-services.json') {
  $taskSaved = Get-Content -LiteralPath '.local/business-services.json' -Raw | ConvertFrom-Json
  foreach ($taskProperty in $taskSaved.PSObject.Properties) { $taskServices[$taskProperty.Name] = $taskProperty.Value }
} elseif (Test-Path -LiteralPath '.local/finance-service.json') {
  $taskServices['user'] = Get-Content -LiteralPath '.local/finance-service.json' -Raw | ConvertFrom-Json
}
function Test-TaskProcess($taskRecord) {
  if (-not $taskRecord) { return $false }
  $taskRunning = Get-Process -Id $taskRecord.pid -ErrorAction SilentlyContinue
  if (-not $taskRunning -or $taskRunning.ProcessName -ne 'node') { return $false }
  $taskAge = ($taskRunning.StartTime.ToUniversalTime() - [DateTimeOffset]::Parse($taskRecord.startedAt).UtcDateTime).TotalSeconds
  if ([Math]::Abs($taskAge) -gt 30) { return $false }
  $taskInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskRecord.pid)"
  return $taskInfo.CommandLine -match 'src[/\\]runtime[/\\]main\.ts'
}
$env:FW_MODE = 'synthetic-local'
foreach ($taskProfile in @('user','ingestion','forecast')) {
  $taskExisting = $taskServices[$taskProfile]
  if (Test-TaskProcess $taskExisting) {
    if (-not $Restart) { continue }
    Stop-Process -Id $taskExisting.pid
    Wait-Process -Id $taskExisting.pid -ErrorAction SilentlyContinue -Timeout 10
  }
  if ($taskProfile -eq 'user' -and (Get-NetTCPConnection -LocalPort 4310 -State Listen -ErrorAction SilentlyContinue)) { throw 'PORT_4310_OWNED_BY_ANOTHER_PROCESS' }
  $env:FW_PROFILE = $taskProfile
  $env:FW_SECRET_FILE = Join-Path $taskDirectory "$taskProfile.json"
  $taskStamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $taskOut = Join-Path $taskDirectory "business-$taskProfile-$taskStamp.stdout.log"
  $taskErr = Join-Path $taskDirectory "business-$taskProfile-$taskStamp.stderr.log"
  $taskProcess = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'src/runtime/main.ts' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput $taskOut -RedirectStandardError $taskErr -PassThru
  $taskServices[$taskProfile] = @{pid=$taskProcess.Id;stdout=$taskOut;stderr=$taskErr;startedAt=[DateTimeOffset]::UtcNow.ToString('o')}
}
$taskServices | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath '.local/business-services.json'
$taskServices['user'] | ConvertTo-Json | Set-Content -LiteralPath '.local/finance-service.json'
$taskDeadline = [DateTimeOffset]::UtcNow.AddSeconds(30)
do {
  $taskReady = $true
  foreach ($taskProfile in @('user','ingestion','forecast')) {
    $taskEntry = $taskServices[$taskProfile]
    if (-not (Test-TaskProcess $taskEntry)) { throw "BUSINESS_PROCESS_EXITED: $taskProfile; inspect $($taskEntry.stderr)" }
    [string]$taskLog = Get-Content -LiteralPath $taskEntry.stdout -Raw -ErrorAction SilentlyContinue
    if ($taskProfile -eq 'user') {
      $taskListener = Get-NetTCPConnection -LocalPort 4310 -State Listen -ErrorAction SilentlyContinue
      if ($taskLog -notmatch 'user API synthetic-local at' -or -not $taskListener -or $taskListener.OwningProcess -ne $taskEntry.pid) { $taskReady = $false }
    }
    elseif ($taskLog -notmatch "$taskProfile synthetic-local worker ready") { $taskReady = $false }
  }
  if ($taskReady) { break }
  if ([DateTimeOffset]::UtcNow -gt $taskDeadline) { throw 'BUSINESS_STARTUP_TIMEOUT' }
  Start-Sleep -Milliseconds 250
} while ($true)
Write-Output 'Local User API, ingestion and forecast services launched in hidden processes.'
