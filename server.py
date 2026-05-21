from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pdf2docx import Converter

app = FastAPI(title="ToolKit Pro PDF to Word Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    source_name = Path(file.filename).name
    if not source_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    tmp_dir = Path(tempfile.mkdtemp(prefix="toolkitpro_pdf2docx_"))
    in_path = tmp_dir / source_name
    out_path = tmp_dir / f"{Path(source_name).stem}_editable.docx"

    try:
        with in_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        converter = Converter(str(in_path))
        try:
            converter.convert(str(out_path), start=0, end=None)
        finally:
            converter.close()

        if not out_path.exists() or out_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Conversion failed: output document is empty.")

        docx_bytes = out_path.read_bytes()
        headers = {"Content-Disposition": f"attachment; filename=\"{out_path.name}\""}
        return StreamingResponse(
            iter([docx_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers=headers,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Conversion error: {exc}") from exc
    finally:
        try:
            await file.close()
        except Exception:
            pass
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=False)
