"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { useInvoices } from "../context/InvoiceContext";
import styles from "./upload.module.css";

export default function UploadPage() {
  const router = useRouter();
  const { addInvoice } = useInvoices();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((f) => ({
      file: f,
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(1) + " MB",
      status: "processing",
      progress: 0,
      invoiceData: null,
    }));

    setFiles((prev) => [...newFiles, ...prev]);

    newFiles.forEach((fileObj, idx) => {
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.floor(Math.random() * 15) + 5;
        if (prog >= 90) {
          clearInterval(interval);
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.name === fileObj.name ? { ...f, progress: prog } : f))
          );
        }
      }, 300);

      const formData = new FormData();
      formData.append("file", fileObj.file);

      const processUpload = async () => {
        try {
          const res = await fetch("http://localhost:8000/process-invoice", {
            method: "POST",
            body: formData,
          });

          const data = await res.json().catch(() => ({}));
          console.log("API RESPONSE:", data);

          if (!res.ok) {
            const errorMsg = data.detail || data.error || "Failed to process invoice";
            alert(errorMsg);
            throw new Error(errorMsg);
          }

          clearInterval(interval);
          const realData = data.parsed || data;
          
          // Add to local state (API handles DB insertion)
          addInvoice(realData);
          
          setFiles((prev) =>
            prev.map((f) =>
              f.name === fileObj.name
                ? { ...f, progress: 100, status: "completed", invoiceData: realData }
                : f
            )
          );

          if (idx === 0) {
            setTimeout(() => {
              if (realData.id) {
                router.push(`/result?id=${realData.id}`);
              } else {
                router.push(`/dashboard`);
              }
            }, 1000);
          }
        } catch (err) {
          clearInterval(interval);
          console.error("Upload error:", err);
          setFiles((prev) =>
            prev.map((f) => (f.name === fileObj.name ? { ...f, progress: 100, status: "error" } : f))
          );
        }
      };
      
      processUpload();
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-with-sidebar" style={{ width: "100%", flex: 1 }}>
        <div className={styles.header}>
          <h2>Upload Invoices</h2>
          <p className={styles.headerSub}>
            Automate your financial workflow. Drop your PDF, PNG, or JPEG files
            here and let Ledge AI extract the data instantly.
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={handleFileInput}
        />

        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragActive ? styles.dragActive : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">
            <span className="material-icons">cloud_upload</span>
          </div>
          <h3 style={{ fontSize: "1.25rem" }}>Drag and drop files here</h3>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9375rem" }}>
            or click to browse from your computer
          </p>
          <div className={styles.formats}>
            <span className={styles.formatBadge}>PDF</span>
            <span className={styles.formatBadge}>PNG</span>
            <span className={styles.formatBadge}>JPEG</span>
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: "var(--sp-4)" }}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <span className="material-icons" style={{ fontSize: 18 }}>folder_open</span>
            Browse Files
          </button>
        </div>

        {/* Current Uploads */}
        {files.length > 0 && (
          <section className={styles.uploadsSection}>
            <h3 className={styles.uploadsTitle}>Current Uploads</h3>
            <div className={`${styles.uploadsList} stagger`}>
              {files.map((file, i) => (
                <div
                  key={i}
                  className={`${styles.fileCard} animate-fade-in-up`}
                  style={{ cursor: file.status === "completed" && file.invoiceData?.id ? "pointer" : "default" }}
                  onClick={() => {
                    if (file.status === "completed" && file.invoiceData?.id) {
                      router.push(`/result?id=${file.invoiceData.id}`);
                    }
                  }}
                >
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${file.progress}%`, backgroundColor: file.status === "error" ? "var(--error)" : "" }}></div>
                  </div>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileIcon}>
                      <span className="material-icons" style={{ color: file.status === "error" ? "var(--error)" : "" }}>
                        {file.status === "completed" ? "check_circle" : file.status === "error" ? "error" : "sync"}
                      </span>
                    </div>
                    <div className={styles.fileMeta}>
                      <p className={styles.fileName}>{file.name}</p>
                      <p className={styles.fileSize}>
                        {file.size}
                        {file.status === "completed" && ` • Processing completed`}
                        {file.status === "processing" && ` • Extracting data (${file.progress}%)`}
                        {file.status === "error" && ` • Error processing file`}
                      </p>
                    </div>
                    <span className={`chip chip-${file.status}`}>
                      {file.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Intelligence & Cloud Sources */}
        <div className={styles.infoRow}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
               <span className="material-icons">psychology</span>
            </div>
            <h4>System Intelligence</h4>
            <p>Our AI model automatically classifies, extracts, and validates invoice data across 40+ fields.</p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <span className="material-icons">cloud_queue</span>
            </div>
            <h4>Cloud Sources</h4>
            <p>Connect to Google Drive, Dropbox, or OneDrive to automatically import invoices as they arrive.</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="page-footer" style={{ marginTop: "var(--sp-10)", marginLeft: "calc(-1 * var(--sp-12))", marginRight: "calc(-1 * var(--sp-12))", marginBottom: "calc(-1 * var(--sp-8))" }}>
          <p className="copyright">© 2024 Ledge AI Financial. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
            <a href="#">Status</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
