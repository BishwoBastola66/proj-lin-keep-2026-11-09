Write-Host "Attempting to free up space on D:\ drive..." -ForegroundColor Cyan

# Empty the Recycle Bin for the D drive
try {
    Clear-RecycleBin -DriveLetter D -Force -ErrorAction Stop
    Write-Host "Recycle bin emptied successfully." -ForegroundColor Green
} catch {
    Write-Host "No files in the recycle bin or could not empty it." -ForegroundColor Yellow
}

# Remove the broken .git folder so we can start fresh
Write-Host "Cleaning up the broken Git installation..." -ForegroundColor Cyan
Remove-Item -Recurse -Force D:\.git -ErrorAction SilentlyContinue

Write-Host "Done! Please check if you have any free space now. You can run the git commands again if space was freed." -ForegroundColor Green
