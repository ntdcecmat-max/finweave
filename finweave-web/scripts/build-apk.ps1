param([string]$VersionName='0.1.9-pilot',[ValidateSet('synthetic_mock','backend')][string]$DataMode='synthetic_mock',[string]$ApiOrigin='')
$ErrorActionPreference='Stop'
$taskWebRoot=Split-Path $PSScriptRoot -Parent
$taskRoot=Split-Path $taskWebRoot -Parent
$taskTools=Join-Path $taskRoot '.local/android-toolchain'
$taskJdk=(Get-ChildItem (Join-Path $taskTools 'jdk') -Directory | Select-Object -First 1).FullName
if(-not $taskJdk){throw 'Portable JDK 21 is missing'}
$env:JAVA_HOME=$taskJdk
$env:ANDROID_HOME=Join-Path $taskTools 'sdk'
$env:GRADLE_USER_HOME=Join-Path $taskTools 'gradle'
$taskSigning=Join-Path $taskTools 'pilot-signing'
$taskKey=Join-Path $taskSigning 'finweave-pilot.p12'
$taskPass=Join-Path $taskSigning 'password.txt'
if(-not(Test-Path -LiteralPath $taskKey)){throw 'Pilot signing key is missing; do not replace the installed identity automatically'}
if($VersionName -notmatch '^\d+\.\d+\.\d+-pilot$'){throw 'Invalid pilot version name'}
if($DataMode -eq 'backend') {
 $taskOrigin=$null
 if(-not [Uri]::TryCreate($ApiOrigin,[UriKind]::Absolute,[ref]$taskOrigin) -or $taskOrigin.Scheme -ne 'https' -or $taskOrigin.UserInfo -or $taskOrigin.AbsolutePath -ne '/' -or $taskOrigin.Query -or $taskOrigin.Fragment) {throw 'Signed backend APK requires an explicit HTTPS origin'}
}
$taskGradle=Get-Content -LiteralPath (Join-Path $taskWebRoot 'android/app/build.gradle') -Raw
$taskDeclaredName=[regex]::Match($taskGradle,'versionName\s+"([^"]+)"').Groups[1].Value
$taskDeclaredCode=[regex]::Match($taskGradle,'versionCode\s+(\d+)').Groups[1].Value
if($taskDeclaredName -ne $VersionName -or -not $taskDeclaredCode){throw 'APK version must match android/app/build.gradle'}
$taskOut=Join-Path $taskRoot 'artifacts/android'
New-Item -ItemType Directory -Force -Path $taskOut | Out-Null
Push-Location $taskWebRoot
$taskPriorMode=$env:VITE_DATA_MODE
try {
 $env:VITE_DATA_MODE=$DataMode
 & node node_modules/typescript/bin/tsc --noEmit
 if($LASTEXITCODE -ne 0){throw 'WEB_TYPECHECK_FAILED'}
 & node node_modules/vite/bin/vite.js build
 if($LASTEXITCODE -ne 0){throw 'WEB_BUILD_FAILED'}
 & node node_modules/@capacitor/cli/bin/capacitor sync android
 if($LASTEXITCODE -ne 0){throw 'CAPACITOR_SYNC_FAILED'}
 & './android/gradlew.bat' -p android --no-daemon :app:testDebugUnitTest :app:assembleDebugAndroidTest :app:assembleRelease :app:lintRelease "-PfwApiOrigin=$ApiOrigin"
 if($LASTEXITCODE -ne 0){throw 'ANDROID_BUILD_FAILED'}
 $taskBuildTools=Join-Path $env:ANDROID_HOME 'build-tools/36.0.0'
 $taskRecord=$VersionName
 $taskAligned=Join-Path $taskTools 'aligned.apk'
 $taskApk=Join-Path $taskOut ('FinWeave-'+$taskRecord+'.apk')
 $taskSignedCandidate=Join-Path $taskTools 'verified-candidate-full.apk'
 $taskUnsigned='android/app/build/outputs/apk/release/app-release-unsigned.apk'
 & (Join-Path $taskBuildTools 'zipalign.exe') -f -p 4 $taskUnsigned $taskAligned
 if($LASTEXITCODE -ne 0){throw 'APK_ALIGN_FAILED'}
 & (Join-Path $taskBuildTools 'apksigner.bat') sign --ks $taskKey --ks-key-alias finweave-pilot --ks-pass ('file:'+$taskPass) --out $taskSignedCandidate $taskAligned
 if($LASTEXITCODE -ne 0){throw 'APK_SIGN_FAILED'}
 $taskVerification=& (Join-Path $taskBuildTools 'apksigner.bat') verify --verbose --print-certs $taskSignedCandidate
 if($LASTEXITCODE -ne 0){throw 'APK_VERIFY_FAILED'}
 $taskVerification | Set-Content -LiteralPath (Join-Path $taskOut ('signature-'+$taskRecord+'.txt'))
 # Inspect the FINAL signed APK, including dependency-merged components and DEX.
 $taskManifestDump=& (Join-Path $taskBuildTools 'aapt2.exe') dump xmltree $taskSignedCandidate --file AndroidManifest.xml
 if($LASTEXITCODE -ne 0){throw 'APK_MANIFEST_INSPECTION_FAILED'}
 $taskPermissions=& (Join-Path $taskBuildTools 'aapt2.exe') dump permissions $taskSignedCandidate
 if($LASTEXITCODE -ne 0){throw 'APK_PERMISSION_INSPECTION_FAILED'}
 $taskManifestDump | Set-Content -LiteralPath (Join-Path $taskOut ('android-manifest-'+$taskRecord+'.txt'))
 $taskPermissions | Set-Content -LiteralPath (Join-Path $taskOut ('permissions-'+$taskRecord+'.txt'))
 $taskManifestText=$taskManifestDump -join "`n"
 # Notification access is essential. Keep it declared and visible; reject unrelated sensitive APIs.
 if($taskManifestText -match 'android.permission.(READ_SMS|RECEIVE_SMS|SEND_SMS|BIND_ACCESSIBILITY_SERVICE|QUERY_ALL_PACKAGES|REQUEST_INSTALL_PACKAGES)') {throw 'UNEXPECTED_SENSITIVE_PERMISSION'}
 if($taskManifestText -notmatch 'BIND_NOTIFICATION_LISTENER_SERVICE' -or $taskManifestText -notmatch 'test.finweave.prototype.collector.CollectorListener') {throw 'COLLECTOR_SERVICE_MISSING'}
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $taskArchive=[IO.Compression.ZipFile]::OpenRead($taskSignedCandidate)
 $taskDexCount=0
 $taskRequiredClasses=@('CollectorListener','FinWeaveCollectorPlugin','FinWeaveOwnerPlugin','NativeProof','ApiSchema','CollectorRuntime','CollectorWorker','Vault','VcbTextCandidate','FinWeaveNotificationTestPlugin','NotificationTestSession','NotificationProbe','ZaloPreview','ZaloPreviewPolicy','ZaloTextCandidate','ZaloCandidatePreview')
 $taskFoundClasses=@{}
 try {
  foreach($taskEntry in $taskArchive.Entries | Where-Object {$_.FullName -match '^classes\d*\.dex$'}) {
   $taskDexCount++
   $taskStream=$taskEntry.Open();$taskMemory=[IO.MemoryStream]::new()
   try {$taskStream.CopyTo($taskMemory);$taskDexText=[Text.Encoding]::ASCII.GetString($taskMemory.ToArray())} finally {$taskStream.Dispose();$taskMemory.Dispose()}
   foreach($taskClass in $taskRequiredClasses) {
    if($taskDexText.Contains('Ltest/finweave/prototype/collector/'+$taskClass+';')) {$taskFoundClasses[$taskClass]=$true}
   }
  }
 } finally {$taskArchive.Dispose()}
 if($taskDexCount -eq 0){throw 'APK_DEX_MISSING'}
 foreach($taskClass in $taskRequiredClasses) {if(-not $taskFoundClasses[$taskClass]) {throw ('COLLECTOR_CLASS_MISSING: '+$taskClass)}}
 $taskSources=[ordered]@{}
 foreach($taskFile in (Get-ChildItem src,tests/android-collector.unit.test.ts,tests/zalopay-analysis.unit.test.ts,android/app/src,android/app/schemas -File -Recurse | Where-Object {$_.FullName -notmatch '[\\/]assets[\\/]'})){
  $taskSources[$taskFile.FullName.Substring($taskWebRoot.Length+1).Replace('\','/')]=(Get-FileHash -LiteralPath $taskFile.FullName -Algorithm SHA256).Hash.ToLower()
 }
 foreach($taskPath in @('package.json','package-lock.json','pnpm-lock.yaml','scripts/build-apk.ps1','scripts/verify-collector.cjs','capacitor.config.json','android/app/build.gradle','android/build.gradle','android/variables.gradle','android/gradle/wrapper/gradle-wrapper.properties')){
  $taskSources[$taskPath]=(Get-FileHash -LiteralPath $taskPath -Algorithm SHA256).Hash.ToLower()
 }
 $taskAssets=[ordered]@{};foreach($taskFile in (Get-ChildItem dist -File -Recurse)){$taskAssets[$taskFile.FullName.Substring((Join-Path $taskWebRoot 'dist').Length+1).Replace('\','/')]=(Get-FileHash -LiteralPath $taskFile.FullName -Algorithm SHA256).Hash.ToLower()}
 $taskCert=($taskVerification | Select-String 'certificate SHA-256 digest:').ToString().Split(':')[-1].Trim()
 $taskPrevious=Get-Content -LiteralPath (Join-Path $taskOut 'manifest-0.1.2-pilot.json') -Raw | ConvertFrom-Json
 if($taskCert -ne $taskPrevious.certificateSha256 -or [int]$taskDeclaredCode -le $taskPrevious.versionCode){throw 'PILOT_UPGRADE_IDENTITY_MISMATCH'}
 Copy-Item -LiteralPath $taskSignedCandidate -Destination $taskApk
 $taskManifest=[ordered]@{status='SIGNED_FULL_COLLECTOR_GOOGLE_REVIEW_PENDING';distribution='direct-full';sensitiveManifestCheck='PASS';dexCheck='PASS';playProtectDeviceTest='NOT_RUN';createdAt=[DateTime]::UtcNow.ToString('o');appId='test.finweave.prototype';versionName=$taskDeclaredName;versionCode=[int]$taskDeclaredCode;minSdk=24;targetSdk=36;apk=(Split-Path $taskApk -Leaf);bytes=(Get-Item -LiteralPath $taskApk).Length;sha256=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLower();certificateSha256=$taskCert;signatureVerified=$true;toolchain=@{node=(& node --version);jdkSource=(Get-Content -LiteralPath (Join-Path $taskTools 'jdk-source.json') -Raw | ConvertFrom-Json);gradle='8.14.3';agp='8.13.0';capacitor='8.5.3';kotlin='2.2.20';room='2.8.4';workManager='2.10.5'};source=$taskSources;assets=$taskAssets;apiRevision='FW-API-T1-D1J2-005';nativeBridgeRevision='FW-NATIVE-BRIDGE-003';consentVersion='2026-10-08';collectorNativeImplemented=$true;collectorEnabled=$false;liveSourceProfiles=0;demoSources=@('VCB','ZaloPay');parserCandidates=@('vcb-text-candidate-1');walletParser='WAITING_NOTIFICATION_SAMPLES';nativeIdentityEnrollment='NOT_CONNECTED';realBackendConnected=$false;modelEnabled=$false;dataMode='synthetic_mock';deviceInstallTest='NOT_RUN';instrumentation='COMPILED_NOT_RUN'}
 $taskManifest.walletParser='GENERIC_VND_CANDIDATE_NOT_REAL_TEMPLATE_VERIFIED'
 $taskManifest.dataMode=$DataMode
 $taskManifest.nativeIdentityEnrollment='IMPLEMENTED_PRIVATE_OWNER_BROKER; ACCEPTANCE_IS_SEPARATE_EVIDENCE'
 $taskManifest.backendOrigin=if($DataMode -eq 'backend'){$ApiOrigin}else{$null}
 $taskManifest.parserCandidates=@('vcb-text-candidate-1','zalopay-generic-vnd-candidate-1')
 $taskManifest.localNotificationPreview=@{source='vn.com.vng.zalopay';versionCode=1074603;versionName='11.14.0';androidApi=30;device='Sony/SO-01M';signerSha256='59dd31fdf36070a0d7f8c8cde843fac371df7f1a915c0136c9c9b55992e8cdae';scope='OPT_IN_SHAPES_AND_CANDIDATE_AMOUNT_DIRECTION_RAM_ONLY';ttlMinutes=15;rawStored=$false;structuredFinancialValuesInRam=$true;uploads=$false;automaticPosting=$false;deviceCallback='NOT_RUN';genericParserVerifiedOnRealNotification=$false}
 $taskManifest | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $taskOut ('manifest-'+$taskRecord+'.json'))
 Write-Output "Verified APK: $taskApk"
} finally {if($null -eq $taskPriorMode){Remove-Item Env:VITE_DATA_MODE -ErrorAction SilentlyContinue}else{$env:VITE_DATA_MODE=$taskPriorMode};Pop-Location}
