import os
import uuid
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from image_processor import preprocess_image
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import Document

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
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    with open(filepath, "wb") as f:
        content = await file.read()
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
        preprocess_image(doc.filepath, processed_path)

    return FileResponse(processed_path, media_type="image/png")