import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import { workspaceApi, type Workspace } from "../../features/workspaces/api";
import { ErrorState, LoadingState } from "../../components/ui";
interface WorkspaceContextValue { workspace: Workspace; workspaces: Workspace[]; select: (id: string) => void; canEdit: boolean; canAdmin: boolean }
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate(); const location = useLocation();
  const [selected, setSelected] = useState(() => sessionStorage.getItem(`workspace:${user?.id}`));
  const list = useQuery({ queryKey: ["workspaces", user?.id], queryFn: workspaceApi.list, refetchInterval: 30000 });
  const routeId = location.pathname.match(/^\/workspaces\/([^/]+)/)?.[1];
  useEffect(() => {
    if (routeId && list.data?.some(w => w.id === routeId)) { setSelected(routeId); sessionStorage.setItem(`workspace:${user?.id}`, routeId); }
  }, [routeId, list.data, user?.id]);
  if (list.isPending) return <LoadingState />;
  if (list.isError) return <ErrorState message="Workspaces could not load. Check that the updated backend is available." retry={() => void list.refetch()} />;
  const personalId = list.data.find(w => w.personal && w.id === user?.id)?.id;
  const chosenId = location.pathname === "/chat" ? personalId : (routeId ?? selected);
  const workspace = list.data.find(w => w.id === chosenId) ?? (!routeId && location.pathname !== "/chat" ? list.data[0] : undefined);
  if (!workspace) return <div className="state"><h1>Workspace unavailable</h1><p>Your access may have changed.</p><Link to="/workspaces">Return to workspaces</Link></div>;
  function select(id: string) { sessionStorage.setItem(`workspace:${user?.id}`, id); setSelected(id); navigate(`/workspaces/${id}`); }
  return <WorkspaceContext.Provider value={{ workspace, workspaces: list.data, select, canEdit: workspace.role !== "VIEWER", canAdmin: workspace.role === "ADMIN" }}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() { const value = useContext(WorkspaceContext); if (!value) throw new Error("WorkspaceProvider required"); return value; }
