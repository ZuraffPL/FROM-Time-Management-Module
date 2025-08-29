# Deploy script for FROM Time Management Module
# Copies changes from development folder to Foundry modules folder

$sourceFolder = "D:\Foundry\Data\systems\deltagreen\FROM-Time-Management-Module"
$targetFolder = "D:\Foundry\Data\modules\from-time-management"

Write-Host "Deploying FROM Time Management Module..." -ForegroundColor Green

# Copy all files except development files
Copy-Item -Path "$sourceFolder\*" -Destination $targetFolder -Recurse -Force -Exclude @(".git*", "GITHUB-*.md", "RELEASE-NOTES-*.md", "module-manifest.json", "deploy-to-modules.ps1")

# Remove .git folder if it was copied
if (Test-Path "$targetFolder\.git") {
    Remove-Item -Path "$targetFolder\.git" -Recurse -Force
}

# Remove dev files if they were copied
Remove-Item -Path "$targetFolder\GITHUB-*.md", "$targetFolder\RELEASE-NOTES-*.md", "$targetFolder\module-manifest.json", "$targetFolder\deploy-to-modules.ps1" -ErrorAction SilentlyContinue

# Get version from module.json
$moduleJson = Get-Content "$targetFolder\module.json" | ConvertFrom-Json
$version = $moduleJson.version

Write-Host "Successfully deployed version $version to Foundry modules folder!" -ForegroundColor Green
Write-Host "Target: $targetFolder" -ForegroundColor Yellow

# Show file count
$fileCount = (Get-ChildItem -Path $targetFolder -Recurse -File).Count
Write-Host "Total files deployed: $fileCount" -ForegroundColor Cyan
