param([switch]$InstallSchedule,[switch]$RemoveSchedule,[string]$NodePath='')
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskName='FinWeave-Local-Synthetic-Observation'
if($RemoveSchedule){Unregister-ScheduledTask -TaskName $taskName -Confirm:$false;exit}
if(-not $NodePath){$NodePath=(Get-Command node).Source}
$taskNode=(Resolve-Path -LiteralPath $NodePath).Path
$env:Path=(Split-Path -Parent $taskNode)+[IO.Path]::PathSeparator+$env:Path
if($InstallSchedule){
 $taskShell=(Get-Command powershell.exe).Source
 $taskAction=New-ScheduledTaskAction -Execute $taskShell -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+$PSCommandPath+'" -NodePath "'+$taskNode+'"') -WorkingDirectory $taskRoot
 $taskTrigger=New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Hours 1)
 $taskSettings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
 Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTrigger -Settings $taskSettings -Description 'Samples only the local synthetic FinWeave scheduler; preserves old gaps and counters.' -Force | Out-Null
 Write-Output 'Hourly local sampling configured. Seven-day acceptance still requires real elapsed observation.'
 exit
}
Push-Location -LiteralPath (Join-Path $taskRoot 'finweave-backend')
try{
 & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/start-async-observation.ps1
 if($LASTEXITCODE -ne 0){throw 'OBSERVATION_START_FAILED'}
 $taskRaw=& $taskNode scripts/observe-async.ts
 if($LASTEXITCODE -ne 0){throw 'OBSERVATION_SAMPLE_FAILED'}
 $taskSample=$taskRaw|ConvertFrom-Json
 [pscustomobject]@{sampledAt=$taskSample.sampledAt;sevenDayObservation=$taskSample.sevenDayObservation;qualification=$taskSample.qualification}|ConvertTo-Json -Depth 5
}finally{Pop-Location}
