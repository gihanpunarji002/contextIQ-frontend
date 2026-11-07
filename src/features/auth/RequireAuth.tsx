import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../app/providers/AuthProvider";
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  );
}
