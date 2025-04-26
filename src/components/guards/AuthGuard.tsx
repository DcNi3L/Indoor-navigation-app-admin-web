import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AuthGuardProps {
  children: JSX.Element;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Можно поставить лоадер
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}