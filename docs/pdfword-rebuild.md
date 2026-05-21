# PDF→Word backend rebuild (Windows + VS Code)

## Quick rebuild
From project root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap_pdfword_windows.ps1
```

## Manual rebuild
1. Create venv:
   `py -3.12 -m venv .venv`
2. Activate:
   `.\.venv\Scripts\Activate.ps1`
3. Install deps:
   `pip install -r .\requirements-pdfword.txt`
4. Install local pdf2docx source if present:
   `pip install -e .\pdf2docx-0.5.13`
5. Start service:
   `python .\server.py`

## Verify
- Health: `http://127.0.0.1:8000/health`
- Endpoint: `POST http://127.0.0.1:8000/api/pdf-to-word`
