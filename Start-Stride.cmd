@echo off
setlocal
if not exist "%~dp0serve.mjs" (
  echo Stride needs the complete extracted project folder.
  echo Right-click the downloaded ZIP and choose Extract All first.
  pause
  exit /b 1
)
cd /d "%~dp0"
if not exist "%~dp0.env" (
  echo Copy .env.example to .env and add your own OpenAI key before using AI.
  echo See PROFESSOR-START-HERE.md for instructions.
)
echo Stride: open http://127.0.0.1:4177 after the listening message.
echo Keep this window open. Press Ctrl+C to stop.
set "STRIDE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%STRIDE_NODE%" (
  "%STRIDE_NODE%" "%~dp0serve.mjs"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js 22 or newer is required. Install it and try again.
  ) else (
    node "%~dp0serve.mjs"
  )
)
pause
