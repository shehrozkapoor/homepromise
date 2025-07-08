"use client"

import Login from "@/Components/Auth/Login";
import HomeComponent from "@/Components/Home/HomePage";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (

    
    isAuthenticated?<HomeComponent isAuthenticated={isAuthenticated}/>:<Login/>
  );
}
