"use client"

import Login from "@/Components/Auth/Login";
import HomeComponent from "@/Components/Home/HomePage";
import { useAuth } from "@/context/AuthContext";
import { Loader2, LogOut } from "lucide-react";

export default function HomePage() {
  // Get the authentication state and the logout function
  const { isAuthenticated, logout, isLoading } = useAuth();

  // Show a loading spinner while the auth state is being determined
  if (isLoading) {
    return (
      <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  return (
    // Conditionally render the correct component.
    isAuthenticated ? (
      // When authenticated, show a wrapper that includes the logout button and the main component.
      <div className="authenticated-layout">
        <header className="page-header">
          <button onClick={logout} className="logout-button">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </header>
        <main>
          <HomeComponent />
        </main>
      </div>
    ) : (
      <Login />
    )
  );
}
