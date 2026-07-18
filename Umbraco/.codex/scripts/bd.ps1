$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).ProviderPath
$bdDir = Join-Path $env:LOCALAPPDATA 'Programs\bd'
$doltDir = Join-Path $env:LOCALAPPDATA 'Programs\dolt'
$bdExe = Join-Path $bdDir 'bd.exe'

if (-not (Test-Path $bdExe)) {
    throw "Beads CLI not found at $bdExe"
}

$env:Path = "$bdDir;$doltDir;$env:Path"
$env:BEADS_DIR = Join-Path $repoRoot '.beads'
$env:DOLT_ROOT_PATH = Join-Path $env:BEADS_DIR 'dolt-root'

if (-not (Test-Path $env:DOLT_ROOT_PATH)) {
    New-Item -ItemType Directory -Path $env:DOLT_ROOT_PATH -Force | Out-Null
}

& $bdExe @args
exit $LASTEXITCODE
