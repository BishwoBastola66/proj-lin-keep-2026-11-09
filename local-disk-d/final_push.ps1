$ErrorActionPreference = "Continue"

Write-Host "Running git fix..." -ForegroundColor Cyan
.\fix_git_add.ps1

Write-Host "Adding files to git..." -ForegroundColor Cyan
git add .

Write-Host "Committing..." -ForegroundColor Cyan
git commit -m "Add all folders to D drive repository"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push
