# FROM Time Management - Release v2.0.0 Preparation Script
# This script prepares the release package for GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FROM Time Management v2.0.0 Release Prep" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set version
$VERSION = "2.0.0"
$MODULE_NAME = "from-time-management"
$MODULE_DIR = "d:\Foundry\Data\modules\from-time-management"
$RELEASE_ZIP = "from-time-management-v$VERSION.zip"

# Navigate to module directory
Set-Location $MODULE_DIR

Write-Host "📁 Working directory: $MODULE_DIR" -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean old release files
Write-Host "🧹 Step 1: Cleaning old release files..." -ForegroundColor Green
if (Test-Path $RELEASE_ZIP) {
    Remove-Item $RELEASE_ZIP -Force
    Write-Host "   ✅ Removed old $RELEASE_ZIP" -ForegroundColor Gray
}

# Step 2: Verify critical files exist
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
    Write-Host "Please ensure all files exist before creating release." -ForegroundColor Red
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
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne 'y') {
        exit 1
    }
}

# Step 4: Create release ZIP
Write-Host ""
Write-Host "📦 Step 4: Creating release ZIP package..." -ForegroundColor Green

# Define files to exclude
$excludePatterns = @(
    '.git*',
    '*.zip',
    'GITHUB-*.md',
    'RELEASE_NOTES_v*.md',
    'deploy-to-modules.ps1',
    'prepare-release-v*.ps1',
    '.vscode'
)

# Get all files except excluded ones
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

# Create temp directory structure
$tempDir = "$env:TEMP\$MODULE_NAME-release"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files maintaining structure
foreach ($file in $filesToInclude) {
    $relativePath = $file.FullName.Substring($MODULE_DIR.Length + 1)
    $targetPath = Join-Path $tempDir $relativePath
    $targetDir = Split-Path $targetPath -Parent
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item $file.FullName -Destination $targetPath -Force
}

# Create ZIP from temp directory
Compress-Archive -Path "$tempDir\*" -DestinationPath $RELEASE_ZIP -CompressionLevel Optimal -Force

# Cleanup temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host "   ✅ Created $RELEASE_ZIP" -ForegroundColor Gray

# Step 5: Verify ZIP contents
Write-Host ""
Write-Host "🔍 Step 5: Verifying ZIP contents..." -ForegroundColor Green

$verifyDir = "$env:TEMP\$MODULE_NAME-verify"
if (Test-Path $verifyDir) {
    Remove-Item $verifyDir -Recurse -Force
}

Expand-Archive -Path $RELEASE_ZIP -DestinationPath $verifyDir -Force

$zipFiles = Get-ChildItem $verifyDir -Recurse -File
Write-Host "   ✅ ZIP contains $($zipFiles.Count) files" -ForegroundColor Gray

# Check for critical files in ZIP
foreach ($file in $requiredFiles) {
    $found = $zipFiles | Where-Object { $_.Name -eq $file }
    if ($found) {
        Write-Host "   ✅ $file" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ $file (MISSING IN ZIP!)" -ForegroundColor Red
    }
}

# Cleanup verify directory
Remove-Item $verifyDir -Recurse -Force

# Step 6: Calculate file sizes
Write-Host ""
Write-Host "📊 Step 6: Package information..." -ForegroundColor Green

$zipInfo = Get-Item $RELEASE_ZIP
$zipSizeMB = [math]::Round($zipInfo.Length / 1MB, 2)

Write-Host "   📦 Package: $RELEASE_ZIP" -ForegroundColor Gray
Write-Host "   📏 Size: $zipSizeMB MB" -ForegroundColor Gray
Write-Host "   📅 Created: $($zipInfo.LastWriteTime)" -ForegroundColor Gray

# Step 7: Generate checksums
Write-Host ""
Write-Host "🔐 Step 7: Generating checksums..." -ForegroundColor Green

$sha256 = Get-FileHash $RELEASE_ZIP -Algorithm SHA256
Write-Host "   SHA256: $($sha256.Hash)" -ForegroundColor Gray

# Save checksums to file
$checksumFile = "checksums-v$VERSION.txt"
@"
FROM Time Management System v$VERSION
Release Package Checksums
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

File: $RELEASE_ZIP
Size: $zipSizeMB MB
SHA256: $($sha256.Hash)
"@ | Out-File $checksumFile -Encoding UTF8

Write-Host "   ✅ Checksums saved to $checksumFile" -ForegroundColor Gray

# Step 8: Git status check
Write-Host ""
Write-Host "📝 Step 8: Git status check..." -ForegroundColor Green

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    Write-Host "   Recommendation: Commit changes before creating release" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Working directory clean" -ForegroundColor Gray
}

# Step 9: Summary and next steps
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Release Package Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Package Information:" -ForegroundColor Yellow
Write-Host "   Version: v$VERSION" -ForegroundColor White
Write-Host "   File: $RELEASE_ZIP" -ForegroundColor White
Write-Host "   Size: $zipSizeMB MB" -ForegroundColor White
Write-Host "   Location: $MODULE_DIR" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Review GITHUB-RELEASE-INSTRUCTIONS-v$VERSION.md" -ForegroundColor White
Write-Host "   2. Commit and push changes to GitHub:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Gray
Write-Host "      git commit -m `"Release v$VERSION - DialogV2 Migration & Smart Archiving`"" -ForegroundColor Gray
Write-Host "      git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Create and push tag:" -ForegroundColor White
Write-Host "      git tag -a v$VERSION -m `"Version $VERSION - DialogV2 Migration & Smart Archiving`"" -ForegroundColor Gray
Write-Host "      git push origin v$VERSION" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Create GitHub Release:" -ForegroundColor White
Write-Host "      - Go to: https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/new" -ForegroundColor Gray
Write-Host "      - Tag: v$VERSION" -ForegroundColor Gray
Write-Host "      - Title: FROM Time Management System v$VERSION - DialogV2 Migration & Smart Archiving" -ForegroundColor Gray
Write-Host "      - Upload: $RELEASE_ZIP" -ForegroundColor Gray
Write-Host "      - Upload: module.json" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Test installation via manifest URL" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt to open release instructions
$openInstructions = Read-Host "Open release instructions? (y/n)"
if ($openInstructions -eq 'y') {
    Invoke-Item "GITHUB-RELEASE-INSTRUCTIONS-v$VERSION.md"
}

Write-Host ""
Write-Host "✨ Release preparation complete! Good luck! ✨" -ForegroundColor Green
Write-Host ""
