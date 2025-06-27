"use client";

import Link from 'next/link';

// You can create a shared layout or import your global CSS to style this page.
// Assuming your styles from `style/globals.css` are loaded in your root layout.

export default function HomePage() {
  return (
    <div className="form-page-container">
      <div className="form-wrapper" style={{ maxWidth: '48rem' }}>
        <div className="form-card" style={{ textAlign: 'center' }}>
          <h1 className="form-title">VA Loan Submission Portal</h1>
          <p className="form-subtitle" style={{ marginBottom: '3rem' }}>
            Please select an action to continue.
          </p>
          
          <div className="homepage-buttons-container">
            <Link href="/transmit" legacyBehavior>
              <a className="homepage-button">
                <div className="button-content">
                  <h2 className="button-title">Transmit Full Loan Package</h2>
                  <p className="button-description">
                    Submit a new loan package with all required PDF and XML documents.
                  </p>
                </div>
              </a>
            </Link>
            
            <Link href="/additional" legacyBehavior>
              <a className="homepage-button">
                <div className="button-content">
                  <h2 className="button-title">Submit Additional Documents</h2>
                  <p className="button-description">
                    Upload additional documents for an existing loan identifier.
                  </p>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
