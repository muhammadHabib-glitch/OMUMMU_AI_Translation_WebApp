import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../services/apiClient";

/** Requires JWT — otherwise send user to Sign In */
export function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/** Login / Signup only for guests — logged-in users go to Translate */
export function GuestRoute({ children }) {
  if (getToken()) {
    return <Navigate to="/translate" replace />;
  }
  return children;
}
