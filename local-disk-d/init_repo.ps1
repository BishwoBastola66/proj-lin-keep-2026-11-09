Add-Content -Path "d:\README.md" -Value "# local-disk-d"
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/CasuallyEpic/local-disk-d.git
git push -u origin main
