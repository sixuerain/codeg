# build_setup.ps1 - Codeg desktop app setup & build for Windows
# Run from the repo root: .\build_setup.ps1
# Optional flags:
#   -SkipInstall   skip prerequisite installation (if already set up)
#   -DevBuild      build in debug mode (faster, larger binary)

param(
    [switch]$SkipInstall,
    [switch]$DevBuild
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Codeg Build Setup"

function Write-Step { param($msg) Write-Host "" ; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [!!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "    [ERR] $msg" -ForegroundColor Red; exit 1 }

# -- 0. Ensure running from repo root ------------------------------------------
if (-not (Test-Path "src-tauri\Cargo.toml")) {
    Write-Fail "Run this script from the codeg repo root (where src-tauri\ lives)."
}

# -- 1. Prerequisites ----------------------------------------------------------
if (-not $SkipInstall) {
    Write-Step "Checking prerequisites..."

    # Node.js (>= 20)
    $nodeOk = $false
    try {
        $nodeVer = (node --version 2>$null) -replace 'v',''
        $nodeMaj = [int]($nodeVer.Split('.')[0])
        if ($nodeMaj -ge 20) { $nodeOk = $true; Write-Ok "Node.js $nodeVer" }
    } catch {}
    if (-not $nodeOk) {
        Write-Warn "Node.js 20+ not found. Installing via winget..."
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("PATH","User")
    }

    # pnpm
    $pnpmOk = $false
    try { $null = pnpm --version 2>$null; $pnpmOk = $true; Write-Ok "pnpm $(pnpm --version)" } catch {}
    if (-not $pnpmOk) {
        Write-Warn "pnpm not found. Installing..."
        npm install -g pnpm
    }

    # Rust / cargo
    $rustOk = $false
    try { $null = cargo --version 2>$null; $rustOk = $true; Write-Ok "$(cargo --version)" } catch {}
    if (-not $rustOk) {
        Write-Warn "Rust not found. Downloading rustup-init.exe..."
        $rustupUrl = "https://win.rustup.rs/x86_64"
        $rustupExe = "$env:TEMP\rustup-init.exe"
        Invoke-WebRequest $rustupUrl -OutFile $rustupExe
        & $rustupExe -y --default-toolchain stable
        $env:PATH += ";$env:USERPROFILE\.cargo\bin"
        Write-Ok "Rust installed. A terminal restart may be needed for PATH to persist."
    }

    # Visual C++ Build Tools - check via vswhere
    $vswhereExe = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
    $vcOk = $false
    if (Test-Path $vswhereExe) {
        $vsPath = & $vswhereExe -latest -property installationPath 2>$null
        if ($vsPath) { $vcOk = $true; Write-Ok "MSVC Build Tools found at $vsPath" }
    }
    if (-not $vcOk) {
        Write-Warn "MSVC Build Tools not found. Installing via winget (this may take a few minutes)..."
        $vsArgs = "--passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
        winget install Microsoft.VisualStudio.2022.BuildTools `
            --override $vsArgs `
            --accept-source-agreements --accept-package-agreements
        Write-Warn "MSVC installed. If the build fails with linker errors, restart this terminal and re-run."
    }

    # WebView2 - check registry
    $wv2Keys = @(
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        "HKCU:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
    )
    $wv2Ok = $wv2Keys | Where-Object { Test-Path $_ }
    if ($wv2Ok) {
        Write-Ok "WebView2 runtime present"
    } else {
        Write-Warn "WebView2 not found. Installing..."
        winget install Microsoft.EdgeWebView2Runtime --accept-source-agreements --accept-package-agreements
    }
}

# -- 2. Refresh PATH -----------------------------------------------------------
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" +
            "$env:USERPROFILE\.cargo\bin"

# -- 3. Install JS dependencies ------------------------------------------------
Write-Step "Installing JS dependencies (pnpm install)..."
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Fail "pnpm install failed." }
Write-Ok "JS dependencies ready"

# -- 4. Build ------------------------------------------------------------------
# Suppress updater signing error (no private key in dev environments)
$env:TAURI_SIGNING_PRIVATE_KEY = ""

if ($DevBuild) {
    Write-Step "Building Tauri app (debug)..."
    pnpm tauri build --debug
} else {
    Write-Step "Building Tauri app (release) - first build takes ~10 min..."
    pnpm tauri build
}

if ($LASTEXITCODE -ne 0) { Write-Fail "Tauri build failed. See output above." }

# -- 5. Report output ----------------------------------------------------------
Write-Step "Build complete! Artifacts:"
$bundleDir = "src-tauri\target\release\bundle"
if ($DevBuild) { $bundleDir = "src-tauri\target\debug\bundle" }

Get-ChildItem $bundleDir -Recurse -Include "*.exe","*.msi" |
    ForEach-Object { Write-Host "    $_" -ForegroundColor White }

Write-Host ""
Write-Host "Run the app directly:" -ForegroundColor Cyan
$exePath = "src-tauri\target\release\codeg.exe"
if ($DevBuild) { $exePath = "src-tauri\target\debug\codeg.exe" }
Write-Host "    $exePath" -ForegroundColor White
