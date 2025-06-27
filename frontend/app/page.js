"use client"
import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle, Loader2 } from 'lucide-react';

// Helper function to convert a file to a Base64 string
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result.split(',')[1]);
    };
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

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  };

  return (
    <div className="file-input-container">
      <label htmlFor={id} className="file-input-label">
        {label}
      </label>
      <div
        className="file-input-dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="file-input-content">
          <UploadCloud className="file-input-icon" />
          {selectedFile ? (
            <div className="file-input-selected-text">
              <span className="file-name">{selectedFile.name}</span>
              <p className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</p>
            </div>
          ) : (
            <span className="file-input-prompt">
              Drop file or <span className="browse-link">browse</span>
            </span>
          )}
        </span>
        <input
          id={id}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="file-input-hidden"
        />
      </div>
    </div>
  );
};

// Main App Component
export default function LoanSubmissionForm() {
  const [loanIdentifier, setLoanIdentifier] = useState('101010101010');
  const [loanReviewPackageFile, setLoanReviewPackageFile] = useState(null);
  const [xmlUCDFile, setXmlUCDFile] = useState(null);
  const [xmlULADFile, setXmlULADFile] = useState(null);

  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [error, setError] = useState(null);
  const [submissionResponse, setSubmissionResponse] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!loanIdentifier || !loanReviewPackageFile || !xmlUCDFile || !xmlULADFile) {
      setError('All fields are required. Please upload all necessary files.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError(null);
    setSubmissionResponse(null);

    try {
      const [packageBase64, ucdBase64, uladBase64] = await Promise.all([
        fileToBase64(loanReviewPackageFile),
        fileToBase64(xmlUCDFile),
        fileToBase64(xmlULADFile),
      ]);

      const payload = {
        loanIdentifier,
        loanReviewPackageFile: packageBase64,
        xmlUCDBase64: ucdBase64,
        xmlULADBase64: uladBase64,
        filename: loanReviewPackageFile.name,
      };

      console.log('Simulating API submission with payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockSuccessResponse = {
        lgyRequestUuid: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        status: "Success",
        message: "Documents transmitted successfully."
      };
      
      setSubmissionResponse(mockSuccessResponse);
      setStatus('success');

    } catch (err) {
      console.error("Submission failed:", err);
      setError('Failed to process files or submit the form. Please try again.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setLoanIdentifier('101010101010');
    setLoanReviewPackageFile(null);
    setXmlUCDFile(null);
    setXmlULADFile(null);
    setStatus('idle');
    setError(null);
    setSubmissionResponse(null);
  };

  return (
    <>
      <div className="form-page-container">
        <div className="form-wrapper">
          <div className="form-card">
            <h1 className="form-title">
              Loan Document Submission
            </h1>
            <p className="form-subtitle">
              Please fill out the form below to transmit loan documents.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-fields-container">
                <div>
                  <label htmlFor="loanIdentifier" className="input-label">
                    Loan Identifier
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="loanIdentifier"
                      value={loanIdentifier}
                      onChange={(e) => setLoanIdentifier(e.target.value)}
                      className="text-input"
                      placeholder="e.g., 101010101010"
                    />
                  </div>
                </div>

                <div className="file-inputs-grid">
                  <FileInput
                      id="loanReviewPackageFile"
                      label="Loan Review Package (PDF)"
                      acceptedTypes=".pdf"
                      onFileSelect={setLoanReviewPackageFile}
                      selectedFile={loanReviewPackageFile}
                    />
                    <div className="file-inputs-column">
                        <FileInput
                            id="xmlUCDFile"
                            label="XML UCD File"
                            acceptedTypes=".xml,text/xml"
                            onFileSelect={setXmlUCDFile}
                            selectedFile={xmlUCDFile}
                          />
                        <FileInput
                            id="xmlULADFile"
                            label="XML ULAD File"
                            acceptedTypes=".xml,text/xml"
                            onFileSelect={setXmlULADFile}
                            selectedFile={xmlULADFile}
                          />
                    </div>
                </div>
                
                <div>
                  <label htmlFor="filename" className="input-label">
                    Filename (from PDF)
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="filename"
                      value={loanReviewPackageFile ? loanReviewPackageFile.name : ''}
                      readOnly
                      className="text-input read-only"
                      placeholder="Will be auto-populated"
                    />
                  </div>
                </div>
              </div>

              <div className="submit-button-wrapper">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="submit-button"
                >
                  {status === 'submitting' && <Loader2 className="spinner" />}
                  {status === 'submitting' ? 'Transmitting Documents...' : 'Transmit Documents'}
                </button>
              </div>
            </form>

            <div className="status-message-wrapper">
              {status === 'error' && (
                <div className="status-box error-box">
                  <X />
                  <span>{error}</span>
                </div>
              )}
              {status === 'success' && (
                <div className="status-box success-box">
                  <div className="success-header">
                      <CheckCircle />
                      <span>Submission Successful!</span>
                  </div>
                  <div className="success-body">
                      <p>API Response:</p>
                      <pre>{JSON.stringify(submissionResponse, null, 2)}</pre>
                  </div>
                  <button onClick={handleReset} className="reset-button">
                      Submit Another
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
