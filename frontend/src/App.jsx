import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Toaster, toast } from "react-hot-toast"

export default function App() {
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [fileSize, setFileSize] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [cardHovered, setCardHovered] = useState(false)

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setFileName(f.name)
    setFileSize((f.size / 1024 / 1024).toFixed(2) + " MB")
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(`Uploaded: ${data.filename}`)
        setUploadCount(c => c + 1)
      } else {
        toast.error("Upload failed")
      }
    } catch {
      toast.error("Cannot reach server")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .floating-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .floating-card:hover {
          transform: translateY(-8px);
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.5),
            0 0 30px rgba(99,102,241,0.2),
            0 0 60px rgba(139,92,246,0.1),
            0 24px 48px rgba(0,0,0,0.5);
        }
        .upload-btn {
          transition: opacity 0.2s, transform 0.15s;
        }
        .upload-btn:hover:not(:disabled) {
          opacity: 0.88;
          transform: scale(1.02);
        }
        .upload-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .dropzone-inner {
          transition: all 0.2s;
        }
        .dropzone-inner:hover {
          border-color: rgba(99,102,241,0.7) !important;
          background: rgba(99,102,241,0.08) !important;
        }
      `}</style>

      <Toaster position="top-right" toastOptions={{
        style: {
          background: "#1a1a2e",
          color: "#fff",
          border: "1px solid rgba(99,102,241,0.3)",
        }
      }} />

      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />

      <div style={s.badge}>AI-powered document scanner</div>
      <h1 style={s.title}>DocuScan <span style={s.titleGrad}>AI</span></h1>
      <p style={s.subtitle}>Drop a document. We'll extract everything automatically.</p>

      <div
        className="floating-card"
        style={{
          ...s.card,
          boxShadow: cardHovered
            ? "0 0 0 1px rgba(99,102,241,0.5), 0 0 30px rgba(99,102,241,0.2), 0 24px 48px rgba(0,0,0,0.5)"
            : "0 8px 32px rgba(0,0,0,0.4)",
        }}
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
      >
        <div
          {...getRootProps()}
          className="dropzone-inner"
          style={{
            ...s.dropzone,
            borderColor: isDragActive ? "rgba(99,102,241,0.9)" : "rgba(99,102,241,0.35)",
            background: isDragActive ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.04)",
          }}
        >
          <input {...getInputProps()} />
          <div style={s.dropIcon}>⬆</div>
          <p style={s.dropTitle}>
            {isDragActive ? "Drop it here..." : "Drag & drop your document"}
          </p>
          <p style={s.dropSub}>or click to browse files</p>
          <div style={s.formats}>
            {["JPG", "PNG", "WEBP", "BMP"].map(f => (
              <span key={f} style={s.fmt}>{f}</span>
            ))}
          </div>
        </div>

        <div style={s.divider} />

        {preview ? (
          <>
            <div style={s.previewRow}>
              <img src={preview} alt="preview" style={s.thumb} />
              <div style={s.fileInfo}>
                <div style={s.fileName}>{fileName}</div>
                <div style={s.fileMeta}>{fileSize} · Image</div>
              </div>
              <div style={s.check}>✓</div>
            </div>
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={uploading}
              style={{ ...s.btn, opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </>
        ) : (
          <p style={s.emptyHint}>No file selected yet</p>
        )}

        <div style={s.stats}>
          {[
            { val: uploadCount, label: "Uploaded" },
            { val: 0, label: "Processed" },
            { val: 0, label: "Extracted" },
          ].map(({ val, label }) => (
            <div key={label} style={s.stat}>
              <div style={s.statVal}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d1f 40%, #0a0f1a 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 24px",
    fontFamily: "system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  orb1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
    top: -150, left: -150, pointerEvents: "none",
  },
  orb2: {
    position: "absolute", width: 350, height: 350, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
    bottom: -100, right: -100, pointerEvents: "none",
  },
  orb3: {
    position: "absolute", width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(192,132,252,0.06) 0%, transparent 70%)",
    top: "40%", right: "15%", pointerEvents: "none",
  },
  badge: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc", fontSize: 11,
    padding: "4px 14px", borderRadius: 20,
    letterSpacing: "0.05em", marginBottom: 20, zIndex: 1,
  },
  title: {
    fontSize: "2.4rem", fontWeight: 700, color: "#fff",
    letterSpacing: "-0.02em", marginBottom: 8,
    textAlign: "center", zIndex: 1,
  },
  titleGrad: {
    background: "linear-gradient(135deg, #818cf8, #c084fc)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "rgba(255,255,255,0.4)", fontSize: "0.9rem",
    marginBottom: 32, textAlign: "center", zIndex: 1,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: 28,
    width: "100%", maxWidth: 480,
    backdropFilter: "blur(20px)",
    zIndex: 1,
  },
  dropzone: {
    border: "1.5px dashed rgba(99,102,241,0.35)",
    borderRadius: 14, padding: "36px 20px",
    textAlign: "center", cursor: "pointer",
  },
  dropIcon: {
    width: 44, height: 44,
    background: "rgba(99,102,241,0.15)",
    borderRadius: 12, display: "flex",
    alignItems: "center", justifyContent: "center",
    margin: "0 auto 14px", fontSize: 20,
  },
  dropTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.9rem", fontWeight: 500, marginBottom: 4,
  },
  dropSub: { color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" },
  formats: { display: "flex", gap: 6, justifyContent: "center", marginTop: 12 },
  fmt: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.4)",
    fontSize: 10, padding: "2px 8px", borderRadius: 6,
  },
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" },
  previewRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  thumb: {
    width: 52, height: 52, borderRadius: 10,
    objectFit: "cover",
    border: "1px solid rgba(99,102,241,0.3)", flexShrink: 0,
  },
  fileInfo: { flex: 1, minWidth: 0 },
  fileName: {
    color: "rgba(255,255,255,0.85)", fontSize: "0.85rem",
    fontWeight: 500, whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis",
  },
  fileMeta: { color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginTop: 2 },
  check: {
    width: 22, height: 22,
    background: "rgba(16,185,129,0.2)", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#10b981", fontSize: 12, flexShrink: 0,
  },
  emptyHint: {
    color: "rgba(255,255,255,0.2)",
    fontSize: "0.8rem", textAlign: "center",
  },
  btn: {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 12,
    fontSize: "0.9rem", fontWeight: 600,
    cursor: "pointer", letterSpacing: "0.01em",
  },
  stats: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8, marginTop: 20,
  },
  stat: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10, padding: 10, textAlign: "center",
  },
  statVal: { color: "#fff", fontSize: "1rem", fontWeight: 600 },
  statLabel: { color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", marginTop: 2 },
}