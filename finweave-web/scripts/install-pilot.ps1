param(
 [ValidateSet('USB','Emulator')][string]$Target='USB',
 [switch]$VerifyOnly
)
$ErrorActionPreference='Stop'
$taskWebRoot=Split-Path $PSScriptRoot -Parent
$taskRoot=Split-Path $taskWebRoot -Parent
$taskTools=Join-Path $taskRoot '.local/android-toolchain'
$taskManifest=Get-Content -LiteralPath (Join-Path $taskRoot 'artifacts/android/manifest-0.1.8-pilot.json') -Raw | ConvertFrom-Json
$taskApk=Join-Path $taskRoot ('artifacts/android/'+$taskManifest.apk)
if($taskManifest.appId -ne 'test.finweave.prototype' -or -not $taskManifest.collectorNativeImplemented){throw 'Expected the full FinWeave pilot'}
if((Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLower() -ne $taskManifest.sha256){throw 'APK hash mismatch; installation stopped'}
$taskJdk=(Get-ChildItem (Join-Path $taskTools 'jdk') -Directory | Select-Object -First 1).FullName
if(-not $taskJdk){throw 'Pilot JDK is missing'}
$env:JAVA_HOME=$taskJdk
$taskSignature=& (Join-Path $taskTools 'sdk/build-tools/36.0.0/apksigner.bat') verify --print-certs $taskApk
if($LASTEXITCODE -ne 0){throw 'APK signature verification failed'}
$taskCert=($taskSignature | Select-String 'certificate SHA-256 digest:').ToString().Split(':')[-1].Trim()
if($taskCert -ne $taskManifest.certificateSha256){throw 'Unexpected signing certificate'}
Write-Output ('Verified full APK: '+$taskManifest.apk)
if($VerifyOnly){return}
$taskAdb=Join-Path $taskTools 'sdk/platform-tools/adb.exe'
$taskSelector=if($Target -eq 'USB'){'-d'}else{'-e'}
$taskState=& $taskAdb $taskSelector get-state
if($LASTEXITCODE -ne 0 -or $taskState -ne 'device'){throw 'Connect one unlocked, authorized USB device or start one emulator. Keep Play Protect enabled.'}
# Standard development install. No permission grants, installer spoofing or security-setting changes.
$taskInstall=& $taskAdb $taskSelector install -r $taskApk
$taskInstall | Write-Output
if($LASTEXITCODE -ne 0 -or $taskInstall -notcontains 'Success'){throw 'Android did not confirm installation. Do not disable security protections to force it.'}
& $taskAdb $taskSelector shell am start -n test.finweave.prototype/.MainActivity
if($LASTEXITCODE -ne 0){throw 'Installed, but Android did not launch FinWeave'}
Write-Output 'Installed the full pilot. Use synthetic demo data. This does not certify a Play Protect verdict.'
