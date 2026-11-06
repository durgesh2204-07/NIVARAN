# Packaging script for NIVARAN Disaster Resilience Platform
param(
    [string]$ProjectRoot = "C:\Users\Durgesh\Downloads\pccoe",
    [string]$ZipName = "nivaran-disaster-resilience-platform.zip"
)

$ErrorActionPreference = "Stop"

Write-Host ">>> Preparing package for NIVARAN platform..." -ForegroundColor Cyan

$tempStaging = Join-Path $env:TEMP "nivaran-package-staging"
$appFolder = Join-Path $tempStaging "nivaran-disaster-resilience-platform"

if (Test-Path $tempStaging) {
    Remove-Item -Recurse -Force $tempStaging
}
New-Item -ItemType Directory -Path $appFolder -Force | Out-Null

# Define directories to include
$dirsToCopy = @("docs", "public", "scripts", "src")
foreach ($d in $dirsToCopy) {
    $srcDir = Join-Path $ProjectRoot $d
    if (Test-Path $srcDir) {
        Copy-Item -Path $srcDir -Destination $appFolder -Recurse -Force
        Write-Host "  + Included directory: $d" -ForegroundColor Green
    }
}

# Define root files to include
$filesToCopy = @(
    ".env.example",
    ".gitignore",
    "HOW_TO_RUN.txt",
    "index.html",
    "package.json",
    "package-lock.json",
    "postcss.config.js",
    "README.md",
    "security.headers.md",
    "tailwind.config.js",
    "TESTING.md",
    "tsconfig.app.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts"
)

foreach ($f in $filesToCopy) {
    $srcFile = Join-Path $ProjectRoot $f
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination $appFolder -Force
        Write-Host "  + Included file: $f" -ForegroundColor Green
    }
}

$tempZipPath = Join-Path $env:TEMP $ZipName
if (Test-Path $tempZipPath) {
    Remove-Item -Force $tempZipPath
}

Write-Host ">>> Compressing into $ZipName..." -ForegroundColor Cyan
Compress-Archive -Path $appFolder -DestinationPath $tempZipPath -CompressionLevel Optimal -Force

# Verify ZIP integrity
Add-Type -AssemblyName System.IO.Compression.FileSystem
$testZip = [System.IO.Compression.ZipFile]::OpenRead($tempZipPath)
$entryCount = $testZip.Entries.Count
$testZip.Dispose()
Write-Host ">>> Verification passed: Archive contains $entryCount items." -ForegroundColor Green

# Output targets
$targets = @(
    (Join-Path $ProjectRoot $ZipName),
    "C:\Users\Durgesh\Downloads\$ZipName",
    "C:\Users\Durgesh\OneDrive\Desktop\$ZipName"
)

foreach ($target in $targets) {
    $targetDir = Split-Path -Parent $target
    if (Test-Path $targetDir) {
        Copy-Item -Path $tempZipPath -Destination $target -Force
        $sizeMb = [math]::Round(((Get-Item $target).Length / 1MB), 2)
        $sizeKb = [math]::Round(((Get-Item $target).Length / 1KB), 1)
        Write-Host ">>> Ready at: $target ($sizeKb KB)" -ForegroundColor Yellow
    }
}

# Clean temp staging
Remove-Item -Recurse -Force $tempStaging
Remove-Item -Force $tempZipPath

Write-Host ">>> Done! Zip file is clean, verified, and ready to send." -ForegroundColor Cyan
