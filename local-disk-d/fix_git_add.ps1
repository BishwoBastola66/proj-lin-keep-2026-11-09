Write-Host "Removing nested .git folders so they can be added to the main repo..." -ForegroundColor Cyan

# Find all .git folders in subdirectories (excluding the root D:\.git)
$nestedGits = Get-ChildItem -Path D:\ -Directory -Filter ".git" -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -ne "D:\.git" }

foreach ($git in $nestedGits) {
    Write-Host "Removing nested git repo: $($git.FullName)" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $git.FullName -ErrorAction SilentlyContinue
}

Write-Host "Nested git folders removed. You can now run 'git add .' safely." -ForegroundColor Green
