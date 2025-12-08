# FROM Time Management - Release v2.0.1 Preparation Script
# Bug fix release for time overflow distribution

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FROM Time Management v2.0.1 Release Prep" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VERSION = "2.0.1"
$MODULE_NAME = "from-time-management"
$MODULE_DIR = "d:\Foundry\Data\modules\from-time-management"
$RELEASE_ZIP = "from-time-management-v$VERSION.zip"

Set-Location $MODULE_DIR

Write-Host "📁 Working directory: $MODULE_DIR" -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean old release files
Write-Host "🧹 Step 1: Cleaning old release files..." -ForegroundColor Green
if (Test-Path $RELEASE_ZIP) {
    Remove-Item $RELEASE_ZIP -Force
    Write-Host "   ✅ Removed old $RELEASE_ZIP" -ForegroundColor Gray
}

# Step 2: Verify critical files
Write-Host ""
Write-Host "🔍 Step 2: Verifying critical files..." -ForegroundColor Green
$requiredFiles = @(
    "module.json",
    "main.mjs",
    "README.md",
    "CHANGELOG.md",
    "VERSION-HISTORY.md",
    "LICENSE",
    "RELEASE_NOTES_v$VERSION.md"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ $file (MISSING!)" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ ERROR: Missing required files!" -ForegroundColor Red
    exit 1
}

# Step 3: Verify version in module.json
Write-Host ""
Write-Host "🔍 Step 3: Verifying version in module.json..." -ForegroundColor Green
$moduleJson = Get-Content "module.json" -Raw | ConvertFrom-Json
if ($moduleJson.version -eq $VERSION) {
    Write-Host "   ✅ Version correct: $VERSION" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Version mismatch! Expected: $VERSION, Found: $($moduleJson.version)" -ForegroundColor Red
    exit 1
}

# Step 4: Create release ZIP
Write-Host ""
Write-Host "📦 Step 4: Creating release ZIP package..." -ForegroundColor Green

$excludePatterns = @(
    '.git*',
    '*.zip',
    'GITHUB-*.md',
    'RELEASE_NOTES_v*.md',
    'deploy-to-modules.ps1',
    'prepare-release-v*.ps1',
    'checksums-v*.txt',
    '.vscode',
    'QUICK-RELEASE-GUIDE-v*.md'
)

$filesToInclude = Get-ChildItem -Recurse -File | Where-Object {
    $file = $_
    $shouldExclude = $false
    
    foreach ($pattern in $excludePatterns) {
        if ($file.Name -like $pattern -or $file.FullName -like "*$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    
    -not $shouldExclude
}

Write-Host "   Including $($filesToInclude.Count) files..." -ForegroundColor Gray

$tempDir = "$env:TEMP\$MODULE_NAME-release"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($file in $filesToInclude) {
    $relativePath = $file.FullName.Substring($MODULE_DIR.Length + 1)
    $targetPath = Join-Path $tempDir $relativePath
    $targetDir = Split-Path $targetPath -Parent
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item $file.FullName -Destination $targetPath -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $RELEASE_ZIP -CompressionLevel Optimal -Force
Remove-Item $tempDir -Recurse -Force

Write-Host "   ✅ Created $RELEASE_ZIP" -ForegroundColor Gray

# Step 5: Generate checksums
Write-Host ""
Write-Host "🔐 Step 5: Generating checksums..." -ForegroundColor Green

$sha256 = Get-FileHash $RELEASE_ZIP -Algorithm SHA256
Write-Host "   SHA256: $($sha256.Hash)" -ForegroundColor Gray

$checksumFile = "checksums-v$VERSION.txt"
$zipInfo = Get-Item $RELEASE_ZIP
$zipSizeMB = [math]::Round($zipInfo.Length / 1MB, 2)

@"
FROM Time Management System v$VERSION
Release Package Checksums
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

File: $RELEASE_ZIP
Size: $zipSizeMB MB
SHA256: $($sha256.Hash)
"@ | Out-File $checksumFile -Encoding UTF8

Write-Host "   ✅ Checksums saved to $checksumFile" -ForegroundColor Gray

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Release Package Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Package Information:" -ForegroundColor Yellow
Write-Host "   Version: v$VERSION" -ForegroundColor White
Write-Host "   Type: Patch (Bug Fix)" -ForegroundColor White
Write-Host "   File: $RELEASE_ZIP" -ForegroundColor White
Write-Host "   Size: $zipSizeMB MB" -ForegroundColor White
Write-Host ""
Write-Host "🐛 Bug Fixed:" -ForegroundColor Yellow
Write-Host "   Time overflow distribution between day/night periods" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Commit changes:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Gray
Write-Host "      git commit -m `"Release v$VERSION - Fix time overflow distribution`"" -ForegroundColor Gray
Write-Host "      git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Create and push tag:" -ForegroundColor White
Write-Host "      git tag -a v$VERSION -m `"Version $VERSION - Time Overflow Distribution Fix`"" -ForegroundColor Gray
Write-Host "      git push origin v$VERSION" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Create GitHub Release:" -ForegroundColor White
Write-Host "      https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/new" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
