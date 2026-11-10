param()
$ErrorActionPreference='Stop'
$taskRoot=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$taskTools=Join-Path $taskRoot '.local/android-toolchain'
$taskAdb=Join-Path $taskTools 'sdk/platform-tools/adb.exe'
$taskState=& $taskAdb -d get-state
if($LASTEXITCODE -ne 0 -or $taskState -ne 'device'){throw 'Connect one authorized USB phone with ZaloPay installed'}
$taskUser=(& $taskAdb -d shell am get-current-user).Trim()
if($taskUser -notmatch '^\d+$'){throw 'Cannot identify current Android user'}
$taskPackage='vn.com.vng.zalopay'
$taskInstalled=& $taskAdb -d shell pm list packages --user $taskUser $taskPackage
if($taskInstalled -notcontains ('package:'+$taskPackage)){throw 'Standalone ZaloPay is not installed for the current Android user; no account data was read'}
$taskPaths=& $taskAdb -d shell pm path --user $taskUser $taskPackage
$taskBase=($taskPaths | Where-Object { $_ -match '^package:/data/app/[^\s]+/base\.apk$' } | Select-Object -First 1)
if(-not $taskBase){throw 'Cannot identify the installed base APK'}
$taskBase=$taskBase.Substring('package:'.Length)
$taskCache=Join-Path $taskTools 'source-inspection/zalopay'
New-Item -ItemType Directory -Force -Path $taskCache | Out-Null
$taskApk=Join-Path $taskCache 'installed-base.apk'
# Read only the public installed application binary, never app-private files or notifications.
& $taskAdb -d pull $taskBase $taskApk
if($LASTEXITCODE -ne 0){throw 'Cannot read installed application binary for signature measurement'}
$taskJdk=(Get-ChildItem (Join-Path $taskTools 'jdk') -Directory | Select-Object -First 1).FullName
if(-not $taskJdk){throw 'Pilot JDK is missing'}
$env:JAVA_HOME=$taskJdk
$taskSignature=& (Join-Path $taskTools 'sdk/build-tools/36.0.0/apksigner.bat') verify --print-certs $taskApk
if($LASTEXITCODE -ne 0){throw 'Installed base APK signature did not verify'}
$taskSigners=@($taskSignature | Where-Object { $_ -match '^Signer #\d+ certificate SHA-256 digest:' } | ForEach-Object { $_.Split(':')[-1].Trim().ToLower() })
if($taskSigners.Count -eq 0){throw 'No measured current APK signer'}
$taskInfo=& $taskAdb -d shell dumpsys package $taskPackage
$taskVersionCode=[regex]::Match(($taskInfo -join "`n"),'versionCode=(\d+)').Groups[1].Value
$taskVersionName=[regex]::Match(($taskInfo -join "`n"),'versionName=([^\r\n]+)').Groups[1].Value.Trim()
if(-not $taskVersionCode -or -not $taskVersionName){throw 'Cannot measure installed version'}
$taskInstaller=& $taskAdb -d shell pm list packages -i --user $taskUser $taskPackage
$taskOrigin=[regex]::Match(($taskInstaller -join "`n"),'installer=([^\s]+)').Groups[1].Value
$taskRecord=[ordered]@{
 status='MEASURED_NOT_ADMITTED';observedAt=[DateTime]::UtcNow.ToString('o');packageName=$taskPackage;
 versionCode=[long]$taskVersionCode;versionName=$taskVersionName;currentSignerSha256=$taskSigners;
 installedBaseApkSha256=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLower();
 reportedInstaller=$taskOrigin;deviceModel=(& $taskAdb -d shell getprop ro.product.model).Trim();
 androidVersion=(& $taskAdb -d shell getprop ro.build.version.release).Trim();androidApi=[int]((& $taskAdb -d shell getprop ro.build.version.sdk).Trim());
 androidUser=[int]$taskUser;officialStoreUrl='https://play.google.com/store/apps/details?id=vn.com.vng.zalopay';
 metadataOnly=$true;notificationContentsRead=$false;privateAccountDataRead=$false;financialActionsPerformed=$false;
 externalUploadPerformed=$false;templateVerified=$false;realRegistryEnabled=$false
}
$taskEvidence=Join-Path $taskRoot 'docs/execution/evidence/android-notification-test-2026-10-12'
New-Item -ItemType Directory -Force -Path $taskEvidence | Out-Null
$taskRecord | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $taskEvidence 'zalopay-installed-identity.json')
$taskRecord | ConvertTo-Json -Depth 5 | Write-Output
