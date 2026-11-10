$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath ([IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')))
try {
  if ((node --version).Trim() -ne 'v24.19.0') { throw 'Node24.19.0 required' }
  if ((pnpm --version).Trim() -ne '11.25.0') { throw 'pnpm11.25.0 required' }
  pnpm install --frozen-lockfile --ignore-scripts --store-dir .local/pnpm-store
  if ($LASTEXITCODE -ne 0) { throw 'Frozen install failed' }
  node node_modules/typescript/bin/tsc --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
  node scripts/verify-pins.ts
  if ($LASTEXITCODE -ne 0) { throw 'API005/DB005/native003 pin verification failed' }
  node scripts/verify-db005-toolchain.ts
  if ($LASTEXITCODE -ne 0) { throw 'Runtime/PG toolchain verification failed' }
  node --test --test-concurrency=1 tests/*.test.ts
  if ($LASTEXITCODE -ne 0) { throw 'Unit regression failed' }
  node scripts/test-runtime.ts
  if ($LASTEXITCODE -ne 0) { throw 'Contract/security/PG concurrency suite failed' }
} finally { Pop-Location }
