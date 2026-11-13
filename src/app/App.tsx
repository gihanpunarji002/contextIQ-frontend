import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AppShell } from "../components/layout/AppShell";
import { Dashboard } from "../features/dashboard/Dashboard";
import { Chat } from "../features/chat/Chat";
import { Documents } from "../features/documents/Documents";
import { WorkspaceProvider } from "./providers/WorkspaceProvider";
import { WorkspaceDetail } from "../features/workspaces/WorkspaceDetail";
import { Organizations } from "../features/organizations/Organizations";
import { OrganizationMembers } from "../features/organizations/OrganizationMembers";
import { Workspaces } from "../features/workspaces/Workspaces";
import { Settings } from "../features/settings/Settings";
import { AuthProvider } from "./providers/AuthProvider";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AuthPage } from "../features/auth/AuthPage";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15000 },
    mutations: { retry: false },
  },
});
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<AuthPage key="login" />} />
              <Route
                path="/register"
                element={<AuthPage key="register" register />}
              />
              <Route element={<RequireAuth />}>
                <Route element={<WorkspaceProvider><Outlet /></WorkspaceProvider>}>
                <Route element={<AppShell />}>
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/organizations" element={<Organizations />} />
                  <Route path="/organizations/:organizationId/members" element={<OrganizationMembers />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="*"
                    element={
                      <div className="state">
                        <h1>Page not found</h1>
                        <a href="/dashboard">Return to overview</a>
                      </div>
                    }
                  />
                </Route>
                <Route path="/workspaces/:workspaceId" element={<AppShell workspaceConsole />}>
                  <Route index element={<WorkspaceDetail />} />
                  <Route path=":tab" element={<WorkspaceDetail />} />
                </Route>
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
