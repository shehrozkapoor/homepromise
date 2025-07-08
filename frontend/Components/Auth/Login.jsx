"use client";

import React, { useState } from 'react';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const loginEndpoint = `${process.env.NEXT_PUBLIC_API_URL}login/`;

    // dj-rest-auth's login view expects form data, not JSON.
    const formData = new FormData();
    formData.append('username', email); // Use 'email' as per our allauth config
    formData.append('password', password);

    try {
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        body: formData,
        // Note: No 'Content-Type' header is needed; the browser sets it
        // to 'multipart/form-data' automatically for FormData.
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle login errors from the backend. dj-rest-auth often returns
        // errors in a 'non_field_errors' array.
        const errorMessage = result.non_field_errors?.[0] || 'Invalid credentials provided.';
        throw new Error(errorMessage);
      }

      // On successful login, dj-rest-auth returns a token in the 'key' field.
      if (result.token) {
        login(result.token); // Pass the token to the auth context to be stored
        router.push('/verify-otp'); // Redirect to the homepage after successful login
      } else {
        throw new Error('Login successful, but no authentication token was received.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <LogIn size={24} />
          </div>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">
            Welcome back! Please enter your details to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-field-wrapper">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-field-wrapper">
              <Lock className="input-icon" size={16} />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
