#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Cleanup unnecessary files from the workspace for Docker optimization
.DESCRIPTION
    Removes cache files, temporary files, legacy code, and other unnecessary items
    to optimize the workspace for Docker builds and deployment.
.EXAMPLE
    .\cleanup-workspace.ps1
#>

param(
    [switch]$DryRun,
    [switch]$Force
)

Write-Host "🧹 Workspace Cleanup Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$workspaceRoot = $PSScriptRoot
$itemsRemoved = 0
$sizeFreed = 0

function Remove-ItemSafely {
    param(
        [string]$Path,
        [string]$Description,
        [switch]$Recurse
    )
    
    if (Test-Path $Path) {
        try {
            if ($DryRun) {
                $size = if ($Recurse) { 
                    (Get-ChildItem $Path -Recurse -File | Measure-Object -Property Length -Sum).Sum 
                } else { 
                    (Get-Item $Path).Length 
                }
                Write-Host "🔍 [DRY RUN] Would remove: $Description" -ForegroundColor Yellow
                Write-Host "   Path: $Path" -ForegroundColor Gray
                Write-Host "   Size: $([math]::Round($size / 1KB, 2)) KB" -ForegroundColor Gray
                return $size
            } else {
                $size = if ($Recurse) { 
                    (Get-ChildItem $Path -Recurse -File | Measure-Object -Property Length -Sum).Sum 
                } else { 
                    (Get-Item $Path).Length 
                }
                
                if ($Recurse) {
                    Remove-Item $Path -Recurse -Force
                } else {
                    Remove-Item $Path -Force
                }
                
                Write-Host "✅ Removed: $Description" -ForegroundColor Green
                Write-Host "   Size freed: $([math]::Round($size / 1KB, 2)) KB" -ForegroundColor Gray
                $script:itemsRemoved++
                return $size
            }
        } catch {
            Write-Host "❌ Failed to remove: $Description" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            return 0
        }
    } else {
        Write-Host "ℹ️  Not found: $Description" -ForegroundColor Blue
        return 0
    }
}

Write-Host ""
Write-Host "🗂️  Cleaning Python cache files..." -ForegroundColor Yellow

# Remove __pycache__ directories
$pycacheDir = Join-Path $workspaceRoot "backend\config\__pycache__"
$sizeFreed += Remove-ItemSafely -Path $pycacheDir -Description "Backend config __pycache__" -Recurse

$pycacheDir = Join-Path $workspaceRoot "backend\services\__pycache__"
$sizeFreed += Remove-ItemSafely -Path $pycacheDir -Description "Backend services __pycache__" -Recurse

Write-Host ""
Write-Host "🔧 Cleaning build artifacts..." -ForegroundColor Yellow

# Remove TypeScript build info
$tsBuildInfo = Join-Path $workspaceRoot "frontend\tsconfig.tsbuildinfo"
$sizeFreed += Remove-ItemSafely -Path $tsBuildInfo -Description "TypeScript build info"

Write-Host ""
Write-Host "🗑️  Cleaning legacy and test files..." -ForegroundColor Yellow

# Remove legacy files
$legacyApp = Join-Path $workspaceRoot "backend\app_legacy.py"
$sizeFreed += Remove-ItemSafely -Path $legacyApp -Description "Legacy app.py file"

# Remove test files
$testCheckpoint = Join-Path $workspaceRoot "backend\test_checkpoint.py"
$sizeFreed += Remove-ItemSafely -Path $testCheckpoint -Description "Test checkpoint script"

$envTest = Join-Path $workspaceRoot "frontend\src\debug\env-test.ts"
$sizeFreed += Remove-ItemSafely -Path $envTest -Description "Environment debug test"

Write-Host ""
Write-Host "📁 Cleaning empty directories..." -ForegroundColor Yellow

# Remove empty embeddings directory
$embeddingsDir = Join-Path $workspaceRoot "backend\models\embeddings"
if (Test-Path $embeddingsDir) {
    $isEmpty = (Get-ChildItem $embeddingsDir | Measure-Object).Count -eq 0
    if ($isEmpty) {
        if ($DryRun) {
            Write-Host "🔍 [DRY RUN] Would remove: Empty embeddings directory" -ForegroundColor Yellow
        } else {
            Remove-Item $embeddingsDir -Force
            Write-Host "✅ Removed: Empty embeddings directory" -ForegroundColor Green
            $script:itemsRemoved++
        }
    }
}

# Remove debug directory if only contained env-test.ts
$debugDir = Join-Path $workspaceRoot "frontend\src\debug"
if (Test-Path $debugDir) {
    $debugFiles = Get-ChildItem $debugDir
    if ($debugFiles.Count -eq 0 -or ($debugFiles.Count -eq 1 -and $debugFiles[0].Name -eq "env-test.ts")) {
        if ($DryRun) {
            Write-Host "🔍 [DRY RUN] Would remove: Debug directory (empty or only contains env-test.ts)" -ForegroundColor Yellow
        } else {
            Remove-Item $debugDir -Recurse -Force
            Write-Host "✅ Removed: Debug directory" -ForegroundColor Green
            $script:itemsRemoved++
        }
    }
}

Write-Host ""
Write-Host "📊 Cleanup Summary" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files were actually removed" -ForegroundColor Yellow
    Write-Host "📏 Total size that would be freed: $([math]::Round($sizeFreed / 1KB, 2)) KB ($([math]::Round($sizeFreed / 1MB, 2)) MB)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Run without -DryRun to perform actual cleanup" -ForegroundColor Blue
} else {
    Write-Host "📦 Items removed: $itemsRemoved" -ForegroundColor Green
    Write-Host "📏 Total space freed: $([math]::Round($sizeFreed / 1KB, 2)) KB ($([math]::Round($sizeFreed / 1MB, 2)) MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "✨ Workspace cleanup completed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Remaining files to consider:" -ForegroundColor Blue
Write-Host "  • frontend\.env (contains development config - review before production)" -ForegroundColor Gray
Write-Host "  • backend\models\knowledge_base\knowledge_base_with_embeddings.pt (model file - needed for operation)" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Blue
Write-Host "  1. Review .dockerignore and .gitignore files" -ForegroundColor Gray
Write-Host "  2. Run 'docker system prune -a' to clean Docker cache" -ForegroundColor Gray
Write-Host "  3. Test application builds to ensure nothing important was removed" -ForegroundColor Gray
