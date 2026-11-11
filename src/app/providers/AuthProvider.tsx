import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { authApi, type User } from "../../features/auth/api";
import { ErrorState, LoadingState } from "../../components/ui";
import { errorMessage } from "../../lib/api/client";
interface Auth {
  user: User | null;
  accept: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cache = useQueryClient();
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setUser(await authApi.me());
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) setUser(null);
      else setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const expired = () => {
      setUser(null);
      void cache.cancelQueries().then(() => cache.clear());
    };
    window.addEventListener("zipzipyai:session-expired", expired);
    return () =>
      window.removeEventListener("zipzipyai:session-expired", expired);
  }, []);
  async function accept(next: User) {
    await cache.cancelQueries();
    cache.clear();
    setUser(next);
  }
  async function logout() {
    await authApi.logout();
    await cache.cancelQueries();
    cache.clear();
    setUser(null);
  }
  if (loading)
    return (
      <div className="auth-loading">
        <LoadingState />
      </div>
    );
  if (error)
    return (
      <div className="auth-loading">
        <ErrorState message={error} retry={() => void refresh()} />
      </div>
    );
  return (
    <AuthContext.Provider value={{ user, accept, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is required");
  return auth;
}
