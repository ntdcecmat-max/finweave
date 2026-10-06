@echo off
cd /d "%~dp0"
set "FW_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%FW_NODE%" (
  "%FW_NODE%" "finweave-web\run-local.cjs" 4181
) else (
  node "finweave-web\run-local.cjs" 4181
)
pause
