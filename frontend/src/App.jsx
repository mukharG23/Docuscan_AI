import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Toaster, toast } from "react-hot-toast"

export default function App() {
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setFileName(file.name)
    setPreview(URL.createObjectURL(file))
    toast.success("File ready to upload!")
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  })

  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
      <h1 style={styles.title}>DocuScan AI</h1>
      <p style={styles.subtitle}>Upload a document image to extract data automatically</p>

      <div {...getRootProps()} style={{
        ...styles.dropzone,
        borderColor: isDragActive ? "#6366f1" : "#444",
        background: isDragActive ? "#1e1b4b" : "#1a1a1a",
      }}>
        <input {...getInputProps()} />
        {isDragActive
          ? <p style={styles.dropText}>Drop it here...</p>
          : <p style={styles.dropText}>Drag & drop a document image here, or click to select</p>
        }
      </div>

      {preview && (
        <div style={styles.previewBox}>
          <p style={styles.fileName}>{fileName}</p>
          <img src={preview} alt="preview" style={styles.previewImg} />
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f0f0f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 24px",
    fontFamily: "sans-serif",
    color: "#fff",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#aaa",
    marginBottom: "32px",
    fontSize: "1rem",
  },
  dropzone: {
    width: "100%",
    maxWidth: "520px",
    border: "2px dashed #444",
    borderRadius: "12px",
    padding: "48px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  dropText: {
    color: "#aaa",
    fontSize: "0.95rem",
  },
  previewBox: {
    marginTop: "32px",
    textAlign: "center",
  },
  fileName: {
    color: "#6366f1",
    marginBottom: "12px",
    fontSize: "0.9rem",
  },
  previewImg: {
    maxWidth: "400px",
    width: "100%",
    borderRadius: "8px",
    border: "1px solid #333",
  },
}