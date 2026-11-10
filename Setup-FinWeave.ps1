param([switch]$Verify)
$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskNode = Get-Command node -ErrorAction SilentlyContinue
$taskPnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $taskNode -or -not $taskPnpm) { throw 'Install Node.js 24.19+ (24.x) and pnpm 11.25.0 in PATH first.' }
$taskVersion = [version]((& node --version).TrimStart('v'))
if ($taskVersion.Major -ne 24 -or $taskVersion -lt [version]'24.19.0') { throw 'Use Node.js 24.19+ in the 24.x release line.' }
if ((& pnpm --version).Trim() -ne '11.25.0') { throw 'Use pnpm 11.25.0 to install the committed lockfiles.' }
foreach ($taskProject in @('finweave-backend','finweave-web','sites/finweave-demo')) {
    Push-Location -LiteralPath (Join-Path $taskRoot $taskProject)
    try {
        & pnpm install --frozen-lockfile --ignore-scripts --store-dir .local/pnpm-store --config.enable-global-virtual-store=false
        if ($LASTEXITCODE -ne 0) { throw "Install failed: $taskProject. Preserve the lockfile and inspect the error." }
    } finally { Pop-Location }
}
if ($Verify) {
    Push-Location -LiteralPath $taskRoot
    try { & node tools/verify-local.mjs; if ($LASTEXITCODE -ne 0) { throw 'Checks failed. Read the results path printed above.' } }
    finally { Pop-Location }
}
Write-Output 'Dependencies ready. Run Start-FinWeave.cmd for the persistent local app. See docs/LOCAL-QUICKSTART.md.'
