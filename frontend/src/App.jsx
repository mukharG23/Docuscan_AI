import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Toaster, toast } from "react-hot-toast"

export default function App() {
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [fileSize, setFileSize] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [processedUrl, setProcessedUrl] = useState(null)
  const [docId, setDocId] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [formData, setFormData] = useState(null)
  const [stats, setStats] = useState({ uploaded: 0, processed: 0, extracted: 0 })
  const [documents, setDocuments] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const fetchStats = () => {
    fetch(`${import.meta.env.VITE_API_URL}/stats`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
  }

  const fetchDocuments = () => {
    fetch(`${import.meta.env.VITE_API_URL}/documents`)
      .then(r => r.json())
      .then(data => setDocuments(data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchStats()
    fetchDocuments()
  }, [])

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setFileName(f.name)
    setFileSize((f.size / 1024 / 1024).toFixed(2) + " MB")
    setPreview(URL.createObjectURL(f))
    setProcessedUrl(null)
    setFormData(null)
    setDocId(null)
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
      const fd = new FormData()
      fd.append("file", file)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, { method: "POST", body: fd })
      const data = await response.json()
      if (response.ok) {
        toast.success(`Uploaded: ${data.filename}`)
        setDocId(data.id)
        const processedRes = await fetch(`${import.meta.env.VITE_API_URL}/processed/${data.id}`)
        const blob = await processedRes.blob()
        setProcessedUrl(URL.createObjectURL(blob))
        fetchStats()
        fetchDocuments()
      } else {
        toast.error(data.detail || "Upload failed")
      }
    } catch {
      toast.error("Cannot reach server")
    } finally {
      setUploading(false)
    }
  }

  const handleExtract = async () => {
    if (!docId) return
    setExtracting(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/structure/${docId}`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setFormData(data.structured_data)
        toast.success("Document structured!")
        fetchStats()
        fetchDocuments()
      } else {
        toast.error("Extraction failed")
      }
    } catch {
      toast.error("Cannot reach server")
    } finally {
      setExtracting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/documents/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Document deleted")
        fetchStats()
        fetchDocuments()
      }
    } catch {
      toast.error("Delete failed")
    }
  }

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleConfirm = () => {
    console.log("Confirmed data:", formData)
    toast.success("Data confirmed!")
  }

  const formatLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

  const clearFile = () => {
    setPreview(null)
    setFile(null)
    setFileName(null)
    setFileSize(null)
    setProcessedUrl(null)
    setFormData(null)
    setDocId(null)
  }

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .btn-hover {
          transition: all 0.2s ease;
        }
        .btn-hover:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .btn-hover:active:not(:disabled) {
          transform: translateY(0px);
        }
        .dropzone-area {
          transition: all 0.25s ease;
        }
        .dropzone-area:hover {
          border-color: rgba(99,102,241,0.6) !important;
          background: rgba(99,102,241,0.06) !important;
        }
        .doc-row {
          transition: background 0.15s ease;
        }
        .doc-row:hover {
          background: rgba(255,255,255,0.05) !important;
        }
        .delete-btn {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .doc-row:hover .delete-btn {
          opacity: 1;
        }
        .form-input:focus {
          outline: none;
          border-color: rgba(99,102,241,0.6) !important;
          background: rgba(99,102,241,0.05) !important;
        }
        .tab-btn {
          transition: all 0.2s ease;
        }
        .tab-btn:hover {
          color: rgba(255,255,255,0.8) !important;
        }
        .feature-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99,102,241,0.4) !important;
        }
      `}</style>

      <Toaster position="top-right" toastOptions={{
        style: {
          background: "#13131f",
          color: "#fff",
          border: "1px solid rgba(99,102,241,0.3)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
        }
      }} />

      {/* Background */}
      <div style={s.bgGrad1} />
      <div style={s.bgGrad2} />
      <div style={s.bgGrid} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}>⬡</div>
          <span style={s.logoText}>DocuScan <span style={s.logoAI}>AI</span></span>
        </div>
        <div style={s.headerRight}>
          <div style={s.statPill}>
            <span style={s.statPillDot} />
            {stats.uploaded} docs scanned
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroTag}>✦ AI-Powered Document Intelligence</div>
        <h1 style={s.heroTitle}>
          Scan. Extract.<br />
          <span style={s.heroGrad}>Understand.</span>
        </h1>
        <p style={s.heroSub}>
          Drop any document — Aadhaar, PAN, invoice, receipt.<br />
          Our pipeline cleans, reads, and structures it automatically.
        </p>
      </section>

      {/* Feature cards */}
      <div style={s.features}>
        {[
          { icon: "◈", title: "OpenCV Pipeline", desc: "Deskew, denoise, binarize — auto-cleaned before OCR" },
          { icon: "◎", title: "EasyOCR Engine", desc: "Neural-net text extraction from any document type" },
          { icon: "⬡", title: "Groq LLM", desc: "llama-3.3-70b structures raw text into clean JSON" },
        ].map(f => (
          <div key={f.title} className="feature-card" style={s.featureCard}>
            <div style={s.featureIcon}>{f.icon}</div>
            <div style={s.featureTitle}>{f.title}</div>
            <div style={s.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={s.mainCard}>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            className="tab-btn"
            onClick={() => setShowHistory(false)}
            style={{ ...s.tab, ...(showHistory ? {} : s.tabActive) }}
          >
            New Scan
          </button>
          <button
            className="tab-btn"
            onClick={() => setShowHistory(true)}
            style={{ ...s.tab, ...(showHistory ? s.tabActive : {}) }}
          >
            History
            {documents.length > 0 && <span style={s.tabBadge}>{documents.length}</span>}
          </button>
        </div>

        <div style={s.divider} />

        {!showHistory ? (
          <>
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className="dropzone-area"
              style={{
                ...s.dropzone,
                borderColor: isDragActive ? "rgba(99,102,241,0.8)" : "rgba(99,102,241,0.25)",
                background: isDragActive ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
              }}
            >
              <input {...getInputProps()} />
              <div style={s.dropIconWrap}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#818cf8" }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={s.dropTitle}>
                {isDragActive ? "Release to scan" : "Drop your document here"}
              </p>
              <p style={s.dropSub}>or click to browse — JPG, PNG, WEBP, BMP</p>
            </div>

            {preview && (
              <>
                <div style={s.divider} />

                {/* Images */}
                <div style={s.imageRow}>
                  <div style={s.imageBox}>
                    <div style={s.imageLabel}>
                      <span style={s.imageDot} />
                      Original
                    </div>
                    <img src={preview} alt="original" style={s.thumb} />
                  </div>
                  {processedUrl && (
                    <div style={s.imageBox}>
                      <div style={s.imageLabel}>
                        <span style={{ ...s.imageDot, background: "#10b981" }} />
                        Processed
                      </div>
                      <img src={processedUrl} alt="processed" style={s.thumb} />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div style={s.fileInfo}>
                  <div style={s.fileIcon}>📄</div>
                  <div>
                    <div style={s.fileName}>{fileName}</div>
                    <div style={s.fileMeta}>{fileSize} · Image</div>
                  </div>
                  <button onClick={clearFile} style={s.clearBtn} className="btn-hover">✕</button>
                </div>

                {/* Action buttons */}
                <div style={s.actionRow}>
                  <button
                    className="btn-hover"
                    onClick={handleUpload}
                    disabled={uploading || !!docId}
                    style={{ ...s.btnPrimary, opacity: (uploading || !!docId) ? 0.5 : 1 }}
                  >
                    {uploading ? (
                      <><span style={s.spinner} /> Uploading...</>
                    ) : docId ? "✓ Uploaded" : "Upload & Process"}
                  </button>

                  {docId && !formData && (
                    <button
                      className="btn-hover"
                      onClick={handleExtract}
                      disabled={extracting}
                      style={{ ...s.btnSecondary, opacity: extracting ? 0.5 : 1 }}
                    >
                      {extracting ? (
                        <><span style={s.spinner} /> Extracting...</>
                      ) : "Extract & Structure →"}
                    </button>
                  )}
                </div>

                {/* Extracted form */}
                {formData && (
                  <>
                    <div style={s.divider} />
                    <div style={s.formHeader}>
                      <div>
                        <div style={s.formTitle}>Extracted Data</div>
                        <div style={s.formSub}>Review and edit before confirming</div>
                      </div>
                      <span style={s.docTypeBadge}>
                        {formData.document_type?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div style={s.formGrid}>
                      {Object.entries(formData)
                        .filter(([key]) => key !== "document_type")
                        .map(([key, value]) => (
                          <div key={key} style={s.fieldGroup}>
                            <label style={s.fieldLabel}>{formatLabel(key)}</label>
                            <input
                              className="form-input"
                              style={s.fieldInput}
                              value={value ?? ""}
                              onChange={e => handleFieldChange(key, e.target.value)}
                            />
                          </div>
                        ))}
                    </div>
                    <button
                      className="btn-hover"
                      onClick={handleConfirm}
                      style={s.btnConfirm}
                    >
                      ✓ Confirm & Submit
                    </button>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          /* History panel */
          <div>
            {documents.length === 0 ? (
              <div style={s.emptyHistory}>
                <div style={s.emptyIcon}>◎</div>
                <div style={s.emptyText}>No documents scanned yet</div>
                <div style={s.emptySub}>Upload a document to get started</div>
              </div>
            ) : (
              <div style={s.docList}>
                <div style={s.docListHeader}>
                  <span style={s.docListCol}>Document</span>
                  <span style={s.docListCol}>Uploaded</span>
                  <span style={s.docListCol}>Status</span>
                  <span />
                </div>
                {documents.map(doc => (
                  <div key={doc.id} className="doc-row" style={s.docRow}>
                    <div style={s.docName}>
                      <div style={s.docFileIcon}>📄</div>
                      <div>
                        <div style={s.docFileName}>{doc.filename}</div>
                        <div style={s.docFileMeta}>ID: {doc.id}</div>
                      </div>
                    </div>
                    <div style={s.docDate}>
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span style={doc.extracted ? s.badgeExtracted : s.badgeUploaded}>
                        {doc.extracted ? "Extracted" : "Uploaded"}
                      </span>
                    </div>
                    <button
                      className="delete-btn btn-hover"
                      onClick={() => handleDelete(doc.id)}
                      style={s.deleteBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats footer */}
        <div style={s.statsRow}>
          {[
            { val: stats.uploaded, label: "Uploaded", color: "#818cf8" },
            { val: stats.processed, label: "Processed", color: "#34d399" },
            { val: stats.extracted, label: "Extracted", color: "#f472b6" },
          ].map(({ val, label, color }) => (
            <div key={label} style={s.statBox}>
              <div style={{ ...s.statVal, color }}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={s.footer}>
        DocuScan AI · Built with FastAPI, EasyOCR, Groq
      </footer>
    </div>
  )
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#0c0c14",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    paddingBottom: 60,
  },
  bgGrad1: {
    position: "fixed", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
    top: -200, left: -200, pointerEvents: "none", zIndex: 0,
  },
  bgGrad2: {
    position: "fixed", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(244,114,182,0.05) 0%, transparent 70%)",
    bottom: -100, right: -100, pointerEvents: "none", zIndex: 0,
  },
  bgGrid: {
    position: "fixed", inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    width: "100%", maxWidth: 900,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "24px 40px",
    zIndex: 1,
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: {
    width: 32, height: 32,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 16,
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.1rem", fontWeight: 700,
    color: "#fff", letterSpacing: "-0.02em",
  },
  logoAI: {
    background: "linear-gradient(135deg, #818cf8, #c084fc)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  statPill: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 20, padding: "5px 12px",
    color: "rgba(255,255,255,0.5)", fontSize: "0.75rem",
  },
  statPillDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#6366f1",
    boxShadow: "0 0 6px #6366f1",
  },
  hero: {
    textAlign: "center", zIndex: 1,
    padding: "40px 20px 20px",
    maxWidth: 600,
  },
  heroTag: {
    color: "rgba(129,140,248,0.8)", fontSize: "0.75rem",
    letterSpacing: "0.1em", marginBottom: 16,
    fontFamily: "'DM Sans', sans-serif",
  },
  heroTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(2rem, 5vw, 3.2rem)",
    fontWeight: 800, color: "#fff",
    lineHeight: 1.1, marginBottom: 16,
    letterSpacing: "-0.03em",
  },
  heroGrad: {
    background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroSub: {
    color: "rgba(255,255,255,0.35)", fontSize: "0.9rem",
    lineHeight: 1.7,
  },
  features: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12, width: "100%", maxWidth: 860,
    padding: "20px 20px 0",
    zIndex: 1,
  },
  featureCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "18px 20px",
  },
  featureIcon: {
    color: "#818cf8", fontSize: 20, marginBottom: 8,
  },
  featureTitle: {
    color: "rgba(255,255,255,0.85)", fontSize: "0.82rem",
    fontWeight: 600, marginBottom: 4,
    fontFamily: "'Syne', sans-serif",
  },
  featureDesc: {
    color: "rgba(255,255,255,0.3)", fontSize: "0.75rem",
    lineHeight: 1.5,
  },
  mainCard: {
    width: "100%", maxWidth: 860,
    margin: "20px auto 0",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20, padding: "28px 32px",
    zIndex: 1,
    marginLeft: 20, marginRight: 20,
  },
  tabs: { display: "flex", gap: 4 },
  tab: {
    padding: "7px 16px", borderRadius: 8,
    border: "none", background: "transparent",
    color: "rgba(255,255,255,0.3)", fontSize: "0.82rem",
    fontWeight: 500, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center", gap: 6,
  },
  tabActive: {
    background: "rgba(99,102,241,0.12)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  tabBadge: {
    background: "rgba(99,102,241,0.3)",
    color: "#a5b4fc", fontSize: "0.65rem",
    padding: "1px 6px", borderRadius: 10,
    fontWeight: 600,
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.05)",
    margin: "20px 0",
  },
  dropzone: {
    border: "1.5px dashed",
    borderRadius: 14, padding: "40px 20px",
    textAlign: "center", cursor: "pointer",
    transition: "all 0.2s",
  },
  dropIconWrap: {
    width: 48, height: 48,
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 14px",
  },
  dropTitle: {
    color: "rgba(255,255,255,0.7)", fontSize: "0.9rem",
    fontWeight: 500, marginBottom: 4,
  },
  dropSub: {
    color: "rgba(255,255,255,0.25)", fontSize: "0.75rem",
  },
  imageRow: {
    display: "flex", gap: 20,
    marginBottom: 16,
  },
  imageBox: {
    flex: 1, display: "flex",
    flexDirection: "column", gap: 8,
  },
  imageLabel: {
    display: "flex", alignItems: "center", gap: 6,
    color: "rgba(255,255,255,0.4)", fontSize: "0.7rem",
    fontWeight: 500, letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  imageDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#818cf8", flexShrink: 0,
  },
  thumb: {
    width: "100%", height: 220,
    borderRadius: 10, objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  fileInfo: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 10, padding: "10px 14px",
    marginBottom: 14,
  },
  fileIcon: { fontSize: 18, flexShrink: 0 },
  fileName: {
    color: "rgba(255,255,255,0.75)", fontSize: "0.82rem",
    fontWeight: 500,
  },
  fileMeta: {
    color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", marginTop: 1,
  },
  clearBtn: {
    marginLeft: "auto", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.4)", borderRadius: 6,
    width: 26, height: 26, cursor: "pointer",
    fontSize: 10, display: "flex",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  actionRow: {
    display: "flex", gap: 10,
  },
  btnPrimary: {
    flex: 1, padding: "11px 20px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: "0.85rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  btnSecondary: {
    flex: 1, padding: "11px 20px",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc", borderRadius: 10,
    fontSize: "0.85rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  btnConfirm: {
    width: "100%", padding: "11px",
    background: "linear-gradient(135deg, #059669, #10b981)",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: "0.85rem", fontWeight: 600,
    cursor: "pointer", marginTop: 16,
    fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    display: "inline-block",
    width: 12, height: 12,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  formHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  formTitle: {
    color: "rgba(255,255,255,0.85)", fontSize: "0.9rem",
    fontWeight: 600, fontFamily: "'Syne', sans-serif",
  },
  formSub: {
    color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", marginTop: 2,
  },
  docTypeBadge: {
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.25)",
    color: "#a5b4fc", fontSize: "0.7rem",
    padding: "3px 10px", borderRadius: 20,
    textTransform: "capitalize", whiteSpace: "nowrap",
  },
  formGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 4 },
  fieldLabel: {
    color: "rgba(255,255,255,0.3)", fontSize: "0.65rem",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
  },
  fieldInput: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, padding: "8px 12px",
    color: "#fff", fontSize: "0.82rem",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  emptyHistory: {
    textAlign: "center", padding: "48px 20px",
  },
  emptyIcon: {
    fontSize: 32, color: "rgba(255,255,255,0.1)", marginBottom: 12,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", fontWeight: 500,
  },
  emptySub: {
    color: "rgba(255,255,255,0.2)", fontSize: "0.75rem", marginTop: 4,
  },
  docList: { display: "flex", flexDirection: "column", gap: 0 },
  docListHeader: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto 32px",
    gap: 16, padding: "0 12px 10px",
    color: "rgba(255,255,255,0.2)", fontSize: "0.65rem",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
  },
  docListCol: {},
  docRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto 32px",
    gap: 16, padding: "10px 12px",
    borderRadius: 8, alignItems: "center",
    cursor: "default",
  },
  docName: { display: "flex", alignItems: "center", gap: 10 },
  docFileIcon: { fontSize: 18, flexShrink: 0 },
  docFileName: {
    color: "rgba(255,255,255,0.7)", fontSize: "0.8rem",
    fontWeight: 500, maxWidth: 200,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  docFileMeta: {
    color: "rgba(255,255,255,0.2)", fontSize: "0.68rem",
  },
  docDate: {
    color: "rgba(255,255,255,0.3)", fontSize: "0.75rem",
    whiteSpace: "nowrap",
  },
  badgeUploaded: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    color: "#818cf8", fontSize: "0.65rem",
    padding: "2px 8px", borderRadius: 20,
    fontWeight: 600, whiteSpace: "nowrap",
  },
  badgeExtracted: {
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.2)",
    color: "#34d399", fontSize: "0.65rem",
    padding: "2px 8px", borderRadius: 20,
    fontWeight: 600, whiteSpace: "nowrap",
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171", borderRadius: 6,
    width: 26, height: 26, cursor: "pointer",
    fontSize: 10, display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8, marginTop: 24,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 20,
  },
  statBox: { textAlign: "center" },
  statVal: { fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Syne', sans-serif" },
  statLabel: {
    color: "rgba(255,255,255,0.25)", fontSize: "0.68rem",
    marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em",
  },
  footer: {
    color: "rgba(255,255,255,0.15)", fontSize: "0.72rem",
    marginTop: 40, zIndex: 1,
  },
}