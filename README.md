# DocuScan AI

A full-stack document intelligence pipeline that processes document images through an OpenCV → EasyOCR → Groq LLM pipeline to extract and structure data automatically.

## Demo

Upload a document image → OpenCV cleans it → EasyOCR reads the text → Groq LLM structures it into JSON → Auto-filled editable form.

## Tech Stack

**Frontend**
- React + Vite
- react-dropzone, react-hot-toast

**Backend**
- FastAPI + Uvicorn
- SQLAlchemy + SQLite
- OpenCV (grayscale, deskew, binarization)
- EasyOCR (neural network OCR)
- Groq API — llama-3.3-70b-versatile (structured extraction)

## Project Structure
docuscan_ai/
├── frontend/
│   └── src/
│       └── App.jsx          ← React UI
├── backend/
│   ├── main.py              ← FastAPI endpoints
│   ├── database.py          ← SQLAlchemy setup
│   ├── models.py            ← Document + Extraction tables
│   ├── image_processor.py   ← ImageProcessor class
│   ├── uploads/             ← original images (gitignored)
│   └── processed/           ← processed images (gitignored)
└── README.md

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload document image |
| GET | `/processed/{doc_id}` | Get OpenCV processed image |
| POST | `/extract/{doc_id}` | Run EasyOCR on document |
| POST | `/structure/{doc_id}` | Run Groq LLM structuring |
| GET | `/documents` | List all documents |
| DELETE | `/documents/{doc_id}` | Delete document |
| GET | `/stats` | Get upload/extraction counts |

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `backend/.env`:
GROQ_API_KEY=your_groq_key
Start server:
```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
VITE_API_URL=http://localhost:8000
Start dev server:
```bash
npm run dev
```

Open `http://localhost:5173`

## Notes

- Backend requires local setup due to PyTorch/EasyOCR dependencies (~2GB RAM)
- Frontend deployed at: https://docuscan-ai.vercel.app
- First EasyOCR run downloads model weights (~200MB) to `~/.EasyOCR/model/`
- Image validation: minimum 50KB and 300x300px required for reliable OCR

## Architecture
Image Upload
↓
OpenCV Pipeline (grayscale → deskew → binarize)
↓
EasyOCR (image → raw text)
↓
Groq LLM (raw text → structured JSON)
↓
React Form (auto-filled, editable)
