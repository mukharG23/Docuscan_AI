import os
import uuid
import json
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from image_processor import processor 
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import Document,Extraction


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

PROCESSED_DIR = "processed"
os.makedirs(PROCESSED_DIR, exist_ok=True)

@app.get("/")
def root():
    return {"message": "DocuScan AI backend is running"}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    content = await file.read()

    # size check — reject files under 50KB
    if len(content) < 10 * 1024:
        raise HTTPException(status_code=400, detail="Image too small. Minimum size is 10KB for reliable OCR.")

    # resolution check
    import io
    from PIL import Image
    img = Image.open(io.BytesIO(content))
    width, height = img.size
    if width < 300 and height < 300:
        raise HTTPException(status_code=400, detail=f"Image resolution too low ({width}x{height}). Minimum is 300x300 pixels.")

    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    with open(filepath, "wb") as f:
        f.write(content)

    doc = Document(
        filename=file.filename,
        filepath=filepath,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "message": "File uploaded successfully"
    }

@app.get("/processed/{doc_id}")
def get_processed_image(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    processed_path = os.path.join(PROCESSED_DIR, "processed_" + os.path.basename(doc.filepath))

    if not os.path.exists(processed_path):
        processor.preprocess(doc.filepath, processed_path)

    return FileResponse(processed_path, media_type="image/png")

@app.post("/extract/{doc_id}")
def extract_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    raw_text = processor.extract_text(doc.filepath)
    return {"doc_id": doc_id, "raw_text": raw_text}

@app.post("/structure/{doc_id}")
def structure_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    raw_text = processor.extract_text(doc.filepath)
    structured = processor.structure_text(raw_text)

    extraction = Extraction(
        doc_id=doc_id,
        raw_text=raw_text,
        structured_data=json.dumps(structured)
    )
    db.add(extraction)
    db.commit()
    db.refresh(extraction)

    return {"doc_id": doc_id, "structured_data": structured}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    upload_count = db.query(Document).count()
    extraction_count = db.query(Extraction).count()
    return {
        "uploaded": upload_count,
        "processed": upload_count,  # every upload gets processed
        "extracted": extraction_count
    }

@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    result = []
    for doc in docs:
        extraction = db.query(Extraction).filter(Extraction.doc_id == doc.id).first()
        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "uploaded_at": doc.uploaded_at,
            "extracted": extraction is not None
        })
    return result

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.query(Extraction).filter(Extraction.doc_id == doc_id).delete()
    db.delete(doc)
    db.commit()
    return {"message": "Deleted"}