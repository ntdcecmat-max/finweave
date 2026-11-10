@echo off
cd /d "%~dp0"
set "FINWEAVE_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies"
if exist "%FINWEAVE_RUNTIME%\node\bin\node.exe" set "PATH=%FINWEAVE_RUNTIME%\node\bin;%FINWEAVE_RUNTIME%\bin\fallback;%PATH%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File Setup-FinWeave.ps1 -Verify
pause
