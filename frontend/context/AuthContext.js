"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On initial load, check localStorage for a fully authenticated session
  useEffect(() => {
    try {
      const data = localStorage.getItem('authData');
      if (data) {
        const authData = JSON.parse(data);
        // Only consider the user logged in if they have a token AND are verified
        if (authData.token && authData.isAuthenticated) {
          setAuthToken(authData.token);
          setIsAuthenticated(true);
        } else if (authData.token) {
          // If they have a token but aren't verified (e.g., page refresh during 2FA)
          setAuthToken(authData.token);
        }
      }
    } catch (e) { 
      console.error("Could not parse auth data from localStorage", e);
      localStorage.removeItem('authData'); // Clear corrupted data
    }
    setIsLoading(false);
  }, []);

  // Step 1: Called by Login page. Stores the token but sets isAuthenticated to false.
  const login = (token) => {
    const authData = { isAuthenticated: false, token: token };
    localStorage.setItem('authData', JSON.stringify(authData));
    setAuthToken(token);
    setIsAuthenticated(false);
  };

  // Step 2: Called by 2FA page after successful OTP check. Finalizes the login.
  const verify = () => {
    const data = localStorage.getItem('authData');
    if (data) {
      try {
        const authData = JSON.parse(data);
        authData.isAuthenticated = true; // Set verified flag
        localStorage.setItem('authData', JSON.stringify(authData));
        setIsAuthenticated(true); // Update the live state
      } catch (e) {
        console.error("Could not update auth data", e);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('authData');
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  // The value provided to the context now correctly uses the state variables.
  // This ensures that any component using the context will re-render when the state changes.
  const value = { isAuthenticated, authToken, login, logout, verify, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
