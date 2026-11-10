$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskTools=Join-Path $taskRoot '.local/android-toolchain'
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'jdk') -Directory | Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'sdk'
$env:GRADLE_USER_HOME=Join-Path $taskTools 'gradle'
Set-Location -LiteralPath (Join-Path $taskRoot 'finweave-web/android')
& .\gradlew.bat :app:testDebugUnitTest :app:assembleDebug -PfwApiOrigin=http://127.0.0.1:4310 --offline --no-daemon --console=plain
exit $LASTEXITCODE
