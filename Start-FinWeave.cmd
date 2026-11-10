@echo off
cd /d "%~dp0"
set "FINWEAVE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%FINWEAVE_NODE%" (
  "%FINWEAVE_NODE%" tools\local-app.mjs
) else (
  node tools\local-app.mjs
)
if errorlevel 1 pause
