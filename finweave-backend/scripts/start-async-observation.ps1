$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $taskRoot
node scripts/resume-async-observation.ts
if ($LASTEXITCODE -ne 0) { throw 'OBSERVATION_DATABASE_RESUME_FAILED' }
$taskCompatibilityOutput = node scripts/check-async-observation.ts
if ($LASTEXITCODE -ne 0) { throw 'OBSERVATION_COMPATIBILITY_FAILED' }
$taskCompatibility = $taskCompatibilityOutput | ConvertFrom-Json
Write-Output $taskCompatibilityOutput
$taskState = Get-Content -LiteralPath '.local/async-observation-state.json' -Raw | ConvertFrom-Json
$env:FW_MODE = 'synthetic-local'
foreach ($taskProfile in @('ingestion','market')) {
  $taskExisting = $taskState.services.$taskProfile
  if ($taskExisting) {
    $taskRunning = Get-Process -Id $taskExisting.pid -ErrorAction SilentlyContinue
    if ($taskRunning -and $taskRunning.ProcessName -eq 'node') {
      $taskAgeDifference = ($taskRunning.StartTime.ToUniversalTime() - [DateTimeOffset]::Parse($taskExisting.startedAt).UtcDateTime).TotalSeconds
      if ([Math]::Abs($taskAgeDifference) -lt 30) {
        if ($taskExisting.codeHash -eq $taskCompatibility.codeHash) { continue }
        if ($taskCompatibility.running.$taskProfile -gt 0) { throw 'OBSERVATION_DRAIN_REQUIRED_FOR_CODE_CHANGE' }
        # Reload only this verified local process; existing DB attempts/quota/receipts stay intact.
        Stop-Process -Id $taskRunning.Id -ErrorAction Stop
      }
    }
  }
  $env:FW_PROFILE = $taskProfile
  $env:FW_SECRET_FILE = Join-Path $taskState.dir "$taskProfile.json"
  $taskStamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $taskOut = Join-Path $taskState.dir "$taskProfile-$taskStamp.stdout.log"
  $taskErr = Join-Path $taskState.dir "$taskProfile-$taskStamp.stderr.log"
  $taskProcess = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'src/runtime/main.ts' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput $taskOut -RedirectStandardError $taskErr -PassThru
  $taskState.services | Add-Member -NotePropertyName $taskProfile -NotePropertyValue @{pid=$taskProcess.Id;stdout=$taskOut;stderr=$taskErr;startedAt=[DateTimeOffset]::UtcNow.ToString('o');codeHash=$taskCompatibility.codeHash;node=$taskCompatibility.node} -Force
}
$taskState | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath '.local/async-observation-state.json'
$taskReadyDeadline = [DateTimeOffset]::UtcNow.AddSeconds(20)
do {
  $taskAllReady = $true
  foreach ($taskProfile in @('ingestion','market')) {
    $taskService = $taskState.services.$taskProfile
    $taskProc = Get-Process -Id $taskService.pid -ErrorAction SilentlyContinue
    if (-not $taskProc -or $taskProc.ProcessName -ne 'node') { throw 'OBSERVATION_WORKER_EXITED' }
    if ([Math]::Abs(($taskProc.StartTime.ToUniversalTime()-[DateTimeOffset]::Parse($taskService.startedAt).UtcDateTime).TotalSeconds) -ge 30) { throw 'OBSERVATION_WORKER_IDENTITY_MISMATCH' }
    if ((Get-Item -LiteralPath $taskService.stderr).Length -gt 0) { throw 'OBSERVATION_WORKER_STDERR' }
    if (-not ((Get-Content -LiteralPath $taskService.stdout -Raw) -like "*$taskProfile synthetic-local worker ready*")) { $taskAllReady = $false }
  }
  if ($taskAllReady) { break }
  Start-Sleep -Milliseconds 500
} while ([DateTimeOffset]::UtcNow -lt $taskReadyDeadline)
if (-not $taskAllReady) { throw 'OBSERVATION_WORKER_NOT_READY' }
Write-Output 'Local ingestion/market workers verified ready; daily 18:00 Asia/Ho_Chi_Minh scheduler is independent of clients.'
