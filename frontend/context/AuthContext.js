"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // This effect runs only once on the client-side after the component mounts.
  useEffect(() => {
    try {
      const storedAuthData = localStorage.getItem('authData');
      if (storedAuthData) {
        const authData = JSON.parse(storedAuthData);
        // Check if the current time is before the expiration time
        if (Date.now() < authData.expiresAt) {
          setIsAuthenticated(true);
        } else {
          // If expired, clear the stored data
          localStorage.removeItem('authData');
        }
      }
    } catch (error) {
      // If there's an error parsing, clear the storage
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.removeItem('authData');
    }
    setIsLoading(false);
  }, []); // The empty dependency array [] ensures this runs only once.

  const login = () => {
    // Set the expiration time to 5 minutes (300,000 milliseconds) from now.
    const expirationTime = Date.now() + 5 * 60 * 1000;
    
    const authData = {
      isAuthenticated: true,
      expiresAt: expirationTime,
    };

    // Store the object with the expiration time in localStorage.
    localStorage.setItem('authData', JSON.stringify(authData));
    setIsAuthenticated(true);
  };

  const logout = () => {
    // When the user logs out, remove the data from localStorage.
    localStorage.removeItem('authData');
    setIsAuthenticated(false);
  };

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
