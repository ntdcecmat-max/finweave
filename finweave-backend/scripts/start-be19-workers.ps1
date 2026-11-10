$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskState=Get-Content -LiteralPath (Join-Path $taskRoot '.local/runtime-state.json') -Raw | ConvertFrom-Json
$taskRecords=@{}
$env:FW_MODE='synthetic-local'
foreach($taskProfile in @('ingestion','market','forecast','agent')) {
 $env:FW_PROFILE=$taskProfile
 $env:FW_SECRET_FILE=Join-Path $taskState.dir "$taskProfile.json"
 $taskOut=Join-Path $taskState.dir "be19-$taskProfile.stdout.log"
 $taskErr=Join-Path $taskState.dir "be19-$taskProfile.stderr.log"
 $taskProcess=Start-Process -FilePath (Get-Command node).Source -ArgumentList 'src/runtime/main.ts' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput $taskOut -RedirectStandardError $taskErr -PassThru
 $taskRecords[$taskProfile]=@{pid=$taskProcess.Id;stdout=$taskOut;stderr=$taskErr;startedAt=[DateTimeOffset]::UtcNow.ToString('o')}
}
$taskRecords | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskRoot '.local/be19-workers.json')
Write-Output 'BE19 synthetic-local workers launched; PID/log metadata saved under .local.'
