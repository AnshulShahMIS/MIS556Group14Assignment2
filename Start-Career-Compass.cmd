@echo off
setlocal
if not exist "%~dp0serve.mjs" (
  echo Career Compass needs the complete extracted folder.
  echo Right-click the downloaded ZIP and choose Extract All.
  echo Open the extracted career-compass folder, then run this launcher again.
  echo Keep serve.mjs and the dist folder beside this launcher.
  pause
  exit /b 1
)
cd /d "%~dp0"
echo Multi-agent edition: open http://127.0.0.1:4177 after the listening message.
echo Keep this window open while using the app. Press Ctrl+C to stop.
set "CAREER_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%CAREER_NODE%" (
  "%CAREER_NODE%" "%~dp0serve.mjs"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js 22 or later is needed. Install Node.js or run this from the Codex workspace.
  ) else (
    node "%~dp0serve.mjs"
  )
)
pause
