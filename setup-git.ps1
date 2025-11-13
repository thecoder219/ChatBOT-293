# Git Setup Script for GitHub
# Run this AFTER installing Git from https://git-scm.com/download/win

Write-Host "Setting up Git repository..." -ForegroundColor Green

# Initialize Git
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
git init

# Remove all files from tracking (but keep locally)
Write-Host "Removing all files from Git tracking..." -ForegroundColor Yellow
git rm -r --cached . 2>$null

# Add only the files we want to track
Write-Host "Adding .gitignore and index.html..." -ForegroundColor Yellow
git add .gitignore
git add index.html

# Commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit - track only index.html"

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Create a repository on GitHub (if you haven't already)" -ForegroundColor White
Write-Host "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor White
Write-Host "3. Run: git push -u origin main" -ForegroundColor White
Write-Host "`n(Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub details)" -ForegroundColor Gray

