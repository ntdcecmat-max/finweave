$ErrorActionPreference = 'Stop'
$backendRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Push-Location -LiteralPath $backendRoot
try {
  if ((node --version).Trim() -ne 'v24.19.0') { throw 'Node24.19.0 required' }
  if ((pnpm --version).Trim() -ne '11.25.0') { throw 'pnpm11.25.0 required' }
  pnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) { throw 'Frozen dependency install failed' }
  node scripts/verify-db005-toolchain.ts
  if ($LASTEXITCODE -ne 0) { throw 'Toolchain/hash verification failed' }
  node node_modules/typescript/bin/tsc --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
  node scripts/test-postgres.ts
  if ($LASTEXITCODE -ne 0) { throw 'Historical regression failed' }
  node scripts/test-db005.ts
  if ($LASTEXITCODE -ne 0) { throw 'DB005 SQL verification failed' }
  node ../tools/backend/audit-db005-handover.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Handover integrity failed' }
} finally { Pop-Location }
