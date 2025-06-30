"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize state to false. We will check localStorage after the component mounts.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Add a loading state to prevent a flash of the wrong UI while we check localStorage.
  const [isLoading, setIsLoading] = useState(true);

  // This effect runs only once on the client-side after the component has mounted.
  // It checks if the user was previously logged in.
  useEffect(() => {
    // Since localStorage is a browser-only API, we access it in useEffect.
    const storedAuthStatus = localStorage.getItem('isAuthenticated');
    if (storedAuthStatus === 'true') {
      setIsAuthenticated(true);
    }
    // We're done checking, so we can show the real UI now.
    setIsLoading(false);
  }, []); // The empty dependency array [] ensures this runs only once.

  const login = () => {
    // When the user logs in, save the status to localStorage.
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    // When the user logs out, remove the status from localStorage.
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  // We provide the loading state so other components can wait until we've checked the auth status.
  const value = { isAuthenticated, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// This custom hook remains the same.
export function useAuth() {
  return useContext(AuthContext);
}
