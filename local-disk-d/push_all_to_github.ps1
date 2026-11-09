$ErrorActionPreference = "Continue"

$directories = Get-ChildItem -Directory

foreach ($dir in $directories) {
    # Skip some known system/irrelevant directories
    if ($dir.Name -match "^(\$RECYCLE\.BIN|System Volume Information|\.git|\.agents)$") {
        continue
    }

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Processing folder: $($dir.Name)" -ForegroundColor Cyan
    
    Push-Location $dir.FullName
    
    try {
        # Initialize Git repository if it doesn't exist
        if (-Not (Test-Path ".git")) {
            Write-Host "Initializing git repository..." -ForegroundColor Yellow
            git init
        }
        
        # Add all files
        git add .
        
        # Check if there are changes to commit
        $status = git status --porcelain
        if ($status) {
            Write-Host "Committing changes..." -ForegroundColor Yellow
            git commit -m "Initial commit"
        } else {
            Write-Host "No changes to commit." -ForegroundColor Gray
        }
        
        # Prepare a valid GitHub repository name (replace spaces and invalid chars with hyphens)
        $repoName = $dir.Name -replace '[^\w\.-]', '-'
        
        # Find gh command
        $ghCmd = "gh"
        $localGh = (Get-ChildItem -Path "d:\gh_cli" -Filter "gh.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
        if ($localGh) {
            $ghCmd = "& '$localGh'"
        }

        # Create private repository and push
        Write-Host "Creating private GitHub repository '$repoName' and pushing..." -ForegroundColor Yellow
        Invoke-Expression "$ghCmd repo create $repoName --private --source . --remote origin --push"
    }
    catch {
        Write-Host "Error processing $($dir.Name): $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
