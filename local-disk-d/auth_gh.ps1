$ghCmd = (Get-ChildItem -Path "d:\gh_cli" -Filter "gh.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1).FullName

if ($ghCmd) {
    Write-Host "Found GitHub CLI at $ghCmd" -ForegroundColor Cyan
    Write-Host "Starting interactive GitHub login..." -ForegroundColor Yellow
    & $ghCmd auth login
} else {
    Write-Host "Could not find gh.exe. Please ensure you ran install_gh.ps1 successfully." -ForegroundColor Red
}
