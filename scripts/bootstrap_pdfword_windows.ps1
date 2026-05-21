Param(
  [string]$PythonVersion = "3.12"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/6] Creating virtual environment with Python $PythonVersion..." -ForegroundColor Cyan
py -$PythonVersion -m venv .venv

Write-Host "[2/6] Activating virtual environment..." -ForegroundColor Cyan
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

Write-Host "[3/6] Upgrading pip/setuptools/wheel..." -ForegroundColor Cyan
python -m pip install --upgrade pip setuptools wheel

Write-Host "[4/6] Installing backend runtime dependencies..." -ForegroundColor Cyan
pip install -r .\requirements-pdfword.txt

Write-Host "[5/6] Installing local pdf2docx source package..." -ForegroundColor Cyan
if (Test-Path .\pdf2docx-0.5.13) {
  pip install -e .\pdf2docx-0.5.13
} else {
  Write-Host "Folder .\\pdf2docx-0.5.13 not found in current branch." -ForegroundColor Yellow
  Write-Host "Pull the branch containing it, or install from PyPI: pip install pdf2docx==0.5.13" -ForegroundColor Yellow
  pip install pdf2docx==0.5.13
}

Write-Host "[6/6] Starting conversion service..." -ForegroundColor Cyan
python .\server.py
