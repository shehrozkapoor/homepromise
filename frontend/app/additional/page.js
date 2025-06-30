"use client";

import React, { useState,useEffect } from 'react';
import { UploadCloud, X, CheckCircle, Loader2, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// --- Configuration ---
const API_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}additional-documents/`;

// Helper function to convert a file to a Base64 string
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// Reusable File Input Component
const FileInput = ({ id, label, acceptedTypes, onFileSelect, selectedFile, multiple = false }) => {
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileSelect(multiple ? Array.from(event.target.files) : event.target.files[0]);
    }
  };
  const handleDragOver = (event) => event.preventDefault();
  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFileSelect(multiple ? Array.from(event.dataTransfer.files) : event.dataTransfer.files[0]);
    }
  };
  return (
    <div className="file-input-container">
      <label htmlFor={id} className="file-input-label">{label}</label>
      <div className="file-input-dropzone" onDragOver={handleDragOver} onDrop={handleDrop}>
        <span className="file-input-content">
          <UploadCloud className="file-input-icon" />
          {selectedFile && !multiple ? (
            <div className="file-input-selected-text">
              <span className="file-name">{selectedFile.name}</span>
              <p className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</p>
            </div>
          ) : (
            <span className="file-input-prompt">
              Drop file(s) or <span className="browse-link">browse</span>
            </span>
          )}
        </span>
        <input id={id} type="file" accept={acceptedTypes} onChange={handleFileChange} className="file-input-hidden" multiple={multiple} />
      </div>
    </div>
  );
};


// Main Component for the Additional Documents Page
export default function AdditionalDocumentsPage() {
  const [loanIdentifier, setLoanIdentifier] = useState('');
  const [xmlUCDFile, setXmlUCDFile] = useState(null);
  const [xmlULADFile, setXmlULADFile] = useState(null);
  const [additionalDocuments, setAdditionalDocuments] = useState([]);

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [submissionResponse, setSubmissionResponse] = useState(null);


  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If the check is complete and the user is not logged in, redirect.
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);
  
  const handleAdditionalFilesSelect = (files) => {
    const newFiles = files.map(file => ({
      file,
      id: `${file.name}-${file.lastModified}`,
      documentType: 'LR File', // Default value
      description: ''
    }));
    setAdditionalDocuments(prev => [...prev, ...newFiles]);
  };

  const updateAdditionalDocument = (id, field, value) => {
    setAdditionalDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, [field]: value } : doc));
  };
  
  const removeAdditionalDocument = (id) => {
    setAdditionalDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Updated validation for the new set of required fields
    if (!loanIdentifier || !xmlUCDFile || !xmlULADFile) {
      setError('Loan Identifier and both XML files are required.');
      setStatus('error');
      return;
    }
    if (!API_ENDPOINT) {
      setError('API endpoint is not configured.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError(null);
    setSubmissionResponse(null);

    try {
      const base64Promises = [
        fileToBase64(xmlUCDFile),
        fileToBase64(xmlULADFile),
        ...additionalDocuments.map(doc => fileToBase64(doc.file))
      ];
      
      const [ucdBase64, uladBase64, ...additionalDocsBase64] = await Promise.all(base64Promises);
      
      const formattedAdditionalDocs = additionalDocuments.map((doc, index) => ({
        name: doc.file.name,
        description: doc.description || `Additional document: ${doc.file.name}`,
        documentType: doc.documentType,
        fileType: "PDF", // Assuming all additional docs are PDFs
        lrFileBase64: additionalDocsBase64[index]
      }));

      // Construct the payload to match the required format
      const payload = {
        loanIdentifier,
        xmlUCDBase64: ucdBase64,
        xmlULADBase64: uladBase64,
        additionalDocuments: formattedAdditionalDocs
      };

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Request failed with status ${response.status}`);
      
      setSubmissionResponse(result);
      setStatus('success');

    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.message || 'An unknown error occurred.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setLoanIdentifier('');
    setXmlUCDFile(null);
    setXmlULADFile(null);
    setAdditionalDocuments([]);
    setStatus('idle');
    setError(null);
    setSubmissionResponse(null);
  };

  return (
    <div className="form-page-container">
      <div className="form-wrapper">
        <div className="form-card">
          <Link href="/" legacyBehavior><a className="back-link">← Back to Home</a></Link>
          <h1 className="form-title">Submit Additional Documents</h1>
          <p className="form-subtitle">Upload XML files and any additional documents for an existing loan.</p>
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-fields-container">
              {/* --- Primary Fields --- */}
              <div>
                <label htmlFor="loanIdentifier" className="input-label">Loan Identifier</label>
                <input type="text" id="loanIdentifier" value={loanIdentifier} onChange={(e) => setLoanIdentifier(e.target.value)} className="text-input" />
              </div>
              <div className="file-inputs-grid">
                <FileInput id="xmlUCDFile" label="XML UCD File" acceptedTypes=".xml,text/xml" onFileSelect={setXmlUCDFile} selectedFile={xmlUCDFile} />
                <FileInput id="xmlULADFile" label="XML ULAD File" acceptedTypes=".xml,text/xml" onFileSelect={setXmlULADFile} selectedFile={xmlULADFile} />
              </div>
              
              {/* --- Additional Documents Section --- */}
              <div className="additional-docs-section">
                <h2 className="section-title">Additional Documents</h2>
                <FileInput id="additionalDocuments" label="Upload one or more files (PDF)" acceptedTypes=".pdf" onFileSelect={handleAdditionalFilesSelect} multiple={true} />
                {additionalDocuments.length > 0 && (
                  <div className="additional-docs-list">
                    {additionalDocuments.map((doc) => (
                      <div key={doc.id} className="additional-doc-item">
                        <FileText className="file-icon" />
                        <div className="doc-details">
                          <span className="doc-name">{doc.file.name}</span>
                          <input 
                            type="text" 
                            placeholder="Description" 
                            className="doc-description-input"
                            value={doc.description}
                            onChange={(e) => updateAdditionalDocument(doc.id, 'description', e.target.value)}
                          />
                        </div>
                        <select 
                          className="doc-type-select" 
                          value={doc.documentType} 
                          onChange={(e) => updateAdditionalDocument(doc.id, 'documentType', e.target.value)}
                        >
                          <option>LR File</option>
                          <option>LR Deficiency</option>
                        </select>
                        <button type="button" onClick={() => removeAdditionalDocument(doc.id)} className="remove-doc-button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="submit-button-wrapper">
              <button type="submit" disabled={status === 'submitting'} className="submit-button">
                {status === 'submitting' && <Loader2 className="spinner" />}
                {status === 'submitting' ? 'Submitting...' : 'Submit Additional Documents'}
              </button>
            </div>
          </form>

          {/* --- Status Messages --- */}
          <div className="status-message-wrapper">
            {status === 'error' && (
              <div className="status-box error-box"><X /><span>{error}</span></div>
            )}
            {status === 'success' && (
              <div className="status-box success-box">
                <div className="success-header"><CheckCircle /><span>Submission Successful!</span></div>
                <div className="success-body">
                  <p>API Response:</p><pre>{JSON.stringify(submissionResponse, null, 2)}</pre>
                </div>
                <button onClick={handleReset} className="reset-button">Submit Another</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
