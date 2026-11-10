$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $taskRoot
$taskState = Get-Content -LiteralPath '.local/runtime-state.json' -Raw | ConvertFrom-Json
$taskListener = Get-NetTCPConnection -LocalPort 4310 -State Listen -ErrorAction SilentlyContinue
if ($taskListener) { throw 'PORT_4310_ALREADY_IN_USE: inspect the existing listener before starting another API.' }
$env:FW_MODE = 'synthetic-local'
$env:FW_PROFILE = 'user'
$env:FW_SECRET_FILE = Join-Path $taskState.dir 'user.json'
$taskStamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$taskOut = Join-Path $taskState.dir "finance-user-$taskStamp.stdout.log"
$taskErr = Join-Path $taskState.dir "finance-user-$taskStamp.stderr.log"
$taskProcess = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'src/runtime/main.ts' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput $taskOut -RedirectStandardError $taskErr -PassThru
@{ pid=$taskProcess.Id; origin='http://127.0.0.1:4310'; stdout=$taskOut; stderr=$taskErr; startedAt=[DateTimeOffset]::UtcNow.ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath '.local/finance-service.json'
Write-Output "Financial User API launched in hidden process $($taskProcess.Id). Logs: $taskOut"
