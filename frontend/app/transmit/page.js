"use client";

import React, { useEffect, useState } from 'react';
import { UploadCloud, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// --- Configuration ---
const API_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}transmit-documents/`;
const MAX_FILE_SIZE_BYTES = 65 * 1024 * 1024; // 65 MB

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
const FileInput = ({ id, label, acceptedTypes, onFileSelect, selectedFile }) => {
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };
  const handleDragOver = (event) => event.preventDefault();
  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  };
  return (
    <div className="file-input-container">
      <label htmlFor={id} className="file-input-label">{label}</label>
      <div className="file-input-dropzone" onDragOver={handleDragOver} onDrop={handleDrop}>
        <span className="file-input-content">
          <UploadCloud className="file-input-icon" />
          {selectedFile ? (
            <div className="file-input-selected-text">
              <span className="file-name">{selectedFile.name}</span>
              {/* Display size in MB for clarity */}
              <p className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            </div>
          ) : (
            <span className="file-input-prompt">
              Drop file or <span className="browse-link">browse</span>
            </span>
          )}
        </span>
        <input id={id} type="file" accept={acceptedTypes} onChange={handleFileChange} className="file-input-hidden" />
      </div>
    </div>
  );
};

// Main App Component
export default function LoanSubmissionForm() {
  const [loanIdentifier, setLoanIdentifier] = useState('');
  const [loanReviewPackageFile, setLoanReviewPackageFile] = useState(null);
  const [xmlUCDFile, setXmlUCDFile] = useState(null);
  const [xmlULADFile, setXmlULADFile] = useState(null);
  
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [sizeError, setSizeError] = useState('');
  const [submissionResponse, setSubmissionResponse] = useState(null);

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the auth check is complete and the user is not logged in, redirect.
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Handler specifically for the main package file to check its size.
  const handlePackageFileSelect = (file) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        setSizeError('File exceeds 65MB limit. Please split the file and use the "Additional Documents" page for overflow parts.');
        setLoanReviewPackageFile(null); // Clear the invalid file selection
    } else {
        setSizeError(''); // Clear any previous error
        setLoanReviewPackageFile(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous submission errors

    // Prevent submission if there's a file size error
    if (sizeError) {
        setError('Please resolve the file size error before submitting.');
        return;
    }

    if (!loanIdentifier || !loanReviewPackageFile || !xmlUCDFile || !xmlULADFile) {
      setError('All primary fields are required.');
      setStatus('error');
      return;
    }
    if (!API_ENDPOINT) {
      setError('API endpoint is not configured.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setSubmissionResponse(null);

    try {
      const base64Promises = [
        fileToBase64(loanReviewPackageFile),
        fileToBase64(xmlUCDFile),
        fileToBase64(xmlULADFile),
      ];
      
      const [packageBase64, ucdBase64, uladBase64] = await Promise.all(base64Promises);
      
      const payload = {
        loanIdentifier,
        loanReviewPackageFile: packageBase64,
        xmlUCDBase64: ucdBase64,
        xmlULADBase64: uladBase64,
        filename: loanReviewPackageFile.name,
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
    setLoanReviewPackageFile(null);
    setXmlUCDFile(null);
    setXmlULADFile(null);
    setStatus('idle');
    setError(null);
    setSizeError(''); // Reset the size error as well
    setSubmissionResponse(null);
  };

  if (isLoading || !isAuthenticated) {
    return (
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Loader2 className="spinner" size={32} />
        </div>
    );
  }

  return (
    <div className="form-page-container">
      <div className="form-wrapper">
        <div className="form-card">
          <Link href="/" legacyBehavior><a className="back-link">← Back to Home</a></Link>
          <h1 className="form-title">Loan Document Submission</h1>
          <p className="form-subtitle">Please fill out the form below to transmit loan documents.</p>
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-fields-container">
              {/* --- Primary Fields --- */}
              <div>
                <label htmlFor="loanIdentifier" className="input-label">Loan Identifier</label>
                <input type="text" id="loanIdentifier" value={loanIdentifier} onChange={(e) => setLoanIdentifier(e.target.value)} className="text-input" />
              </div>
              <div className="file-inputs-grid">
                <div>
                    <FileInput id="loanReviewPackageFile" label="Loan Review Package (PDF)" acceptedTypes=".pdf" onFileSelect={handlePackageFileSelect} selectedFile={loanReviewPackageFile} />
                    {sizeError && (
                        <div className="error-message" style={{ marginTop: '0.5rem' }}>
                            <AlertCircle size={16} />
                            <span>{sizeError}</span>
                        </div>
                    )}
                </div>
                <div className="file-inputs-column">
                  <FileInput id="xmlUCDFile" label="XML UCD File" acceptedTypes=".xml,text/xml" onFileSelect={setXmlUCDFile} selectedFile={xmlUCDFile} />
                  <FileInput id="xmlULADFile" label="XML ULAD File" acceptedTypes=".xml,text/xml" onFileSelect={setXmlULADFile} selectedFile={xmlULADFile} />
                </div>
              </div>
              <div>
                <label htmlFor="filename" className="input-label">Filename (from PDF)</label>
                <input type="text" id="filename" value={loanReviewPackageFile ? loanReviewPackageFile.name : ''} readOnly className="text-input read-only" />
              </div>
            </div>

            <div className="submit-button-wrapper">
              <button type="submit" disabled={status === 'submitting' || !!sizeError} className="submit-button">
                {status === 'submitting' && <Loader2 className="spinner" />}
                {status === 'submitting' ? 'Transmitting...' : 'Transmit Documents'}
              </button>
            </div>
          </form>

          {/* --- Status Messages --- */}
          <div className="status-message-wrapper">
            {status === 'error' && status !== 'submitting' && (
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
