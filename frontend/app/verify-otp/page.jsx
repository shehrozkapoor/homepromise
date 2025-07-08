"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { useRouter } from 'next/navigation';

export default function TwoFactorAuthPage() {
  const [otp, setOtp] = useState(new Array(4).fill(""));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const inputRefs = useRef([]);
  
  const { authToken, verify } = useAuth();
  const router = useRouter();

  // Function to request a new OTP from the backend
  const handleResendCode = async () => {
    if (!authToken) {
        setError("Your session has expired. Please log in again.");
        return;
    }
    setResendStatus('Sending...');
    setError(''); // Clear previous errors

    try {
      const sendOtpEndpoint = `${process.env.NEXT_PUBLIC_API_URL}send-otp/`;
      const response = await fetch(sendOtpEndpoint, {
        method: 'GET',
        headers: { 'Authorization': `Token ${authToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to request a new code.');
      }
      setResendStatus('A new code has been sent.');
      // Clear the message after 5 seconds
      setTimeout(() => setResendStatus(''), 5000);
    } catch (e) {
      setError(e.message);
      setResendStatus(''); // Clear sending status on error
    }
  };

  // Send an OTP code when the page first loads
  useEffect(() => {
    if (authToken) {
        handleResendCode();
    }
  }, [authToken]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const code = otp.join("");
    const verifyEndpoint = `${process.env.NEXT_PUBLIC_API_URL}verify-otp/?otp=${code}`;

    if (!authToken) {
        setError("Your session has expired. Please log in again.");
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch(verifyEndpoint, {
            method: 'GET',
            headers: { 'Authorization': `Token ${authToken}` }
        });

        if (!response.ok) {
            const result = await response.json().catch(() => null);
            throw new Error(result?.detail || 'Invalid verification code.');
        }

        verify();
        router.push('/');

    } catch (err) {
        setError(err.message);
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-page-container">
        <div className="auth-card">
          <div className="auth-header">
             <div className="auth-icon-wrapper"><ShieldCheck size={24} /></div>
             <h1 className="auth-title">Two-Factor Authentication</h1>
             <p className="auth-subtitle">A verification code has been sent to your email.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="otp-input-group">
              {otp.map((data, index) => (
                  <input
                    key={index} type="text" name="otp" className="otp-input"
                    maxLength="1" value={data}
                    onChange={e => handleChange(e.target, index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    onFocus={e => e.target.select()}
                    ref={el => (inputRefs.current[index] = el)}
                  />
              ))}
            </div>
            
            {error && (
              <div className="error-message"><AlertCircle size={16} /><span>{error}</span></div>
            )}

            <button type="submit" className="submit-button" disabled={isLoading || otp.join("").length !== 4}>
              {isLoading ? <Loader2 className="spinner" size={20} /> : 'Verify Code'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Didn't receive a code? <button type="button" onClick={handleResendCode} className="resend-button" disabled={!!resendStatus}>
                {resendStatus || 'Resend'}
            </button></p>
          </div>
        </div>
      </div>
    </>
  );
}
