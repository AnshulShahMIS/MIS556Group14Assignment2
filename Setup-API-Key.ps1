$ErrorActionPreference = 'Stop'
Write-Host 'Career Compass local API key setup'
Write-Host 'Use your own OpenAI API key. Do not paste it into GitHub or chat.'
Write-Host 'Input is hidden. The key will be stored in .env beside serve.mjs, outside the public dist folder.'
Write-Host 'Do not share or manually zip the .env file.'
$careerSecret = Read-Host 'Paste your OpenAI API key and press Enter' -AsSecureString
$careerPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($careerSecret)
try {
  $careerKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($careerPointer).Trim()
  if ($careerKey -notmatch '^sk-[A-Za-z0-9_-]{20,}$') { throw 'The key format is invalid. No file was changed.' }
  $careerEnvPath = Join-Path $PSScriptRoot '.env'
  $careerLines = @()
  if (Test-Path -LiteralPath $careerEnvPath) {
    $careerLines = @(Get-Content -LiteralPath $careerEnvPath | Where-Object { $_ -notmatch '^\s*(export\s+)?OPENAI_API_KEY\s*=' })
  }
  $careerLines += 'OPENAI_API_KEY=' + $careerKey
  [IO.File]::WriteAllLines($careerEnvPath, [string[]]$careerLines, [Text.UTF8Encoding]::new($false))
  Write-Host 'Saved locally. Checking authentication without printing the key...'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($careerPointer)
  $careerKey = $null
  $careerLines = $null
  $careerSecret.Dispose()
}
$careerNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $careerNode)) { $careerNode = (Get-Command node -ErrorAction Stop).Source }
& $careerNode (Join-Path $PSScriptRoot 'check-api-key.mjs')
if ($LASTEXITCODE -ne 0) { Write-Host 'Configuration is saved, but authentication was not confirmed. The message above explains the next step.' }
Write-Host 'Restart Career Compass after setup. AI mode will use the server-side key; generation requires model access and API quota.'
