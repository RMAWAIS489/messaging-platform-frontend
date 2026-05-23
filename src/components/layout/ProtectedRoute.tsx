import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAppSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
