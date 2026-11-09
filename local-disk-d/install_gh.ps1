$ErrorActionPreference = "Stop"

Write-Host "Fetching latest release information..." -ForegroundColor Cyan
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/cli/cli/releases/latest"
$asset = $release.assets | Where-Object { $_.name -match "windows_amd64\.zip" }
$url = $asset.browser_download_url

Write-Host "Downloading GitHub CLI (gh) from $url..." -ForegroundColor Cyan
$zipPath = "d:\gh_cli.zip"
$extractPath = "d:\gh_cli"

Invoke-WebRequest -Uri $url -OutFile $zipPath
Write-Host "Extracting to $extractPath..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

$ghPath = (Get-ChildItem -Path $extractPath -Filter "gh.exe" -Recurse).FullName

if ($ghPath) {
    Write-Host "GitHub CLI downloaded successfully to: $ghPath" -ForegroundColor Green
    Write-Host "Please run the following command to authenticate:" -ForegroundColor Yellow
    Write-Host "& '$ghPath' auth login" -ForegroundColor White
    Write-Host "`nAfter authenticating, you can run the push script but we need to modify it to use this path."
} else {
    Write-Host "Failed to find gh.exe after extraction." -ForegroundColor Red
}
