import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router";
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  Layers3,
  LayoutDashboard,
  MessageSquare,
  Files,
  Users,
  Settings,
  PanelLeftClose,
  Menu,
  Search,
  Sun,
  Moon,
  ArrowUpRight,
  X,
  LogOut,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../../features/workspaces/api";
import "./workspace-console.css";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useAuth } from "../../app/providers/AuthProvider";
import { errorMessage } from "../../lib/api/client";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { NotificationPanel } from "../../features/notifications/NotificationPanel";
import { Breadcrumbs } from "./Breadcrumbs";
import { ErrorState } from "../ui";
const navigation = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/chat", "Personal assistant", MessageSquare],
  ["/documents", "Documents", Files],
  ["/workspaces", "Workspaces", Layers3],
  ["/organizations", "Organizations", Building2],
  ["/settings", "Settings", Settings],
] as const;
export function AppShell({ workspaceConsole = false }: { workspaceConsole?: boolean }) {
  const { workspace, workspaces, select } = useWorkspace();
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: workspaceApi.organizations, enabled: workspaceConsole, refetchInterval: workspaceConsole ? 30000 : false });
  const organizationAdmin = organizations.data?.find(org => org.id === workspace.organizationId)?.role === "ADMIN";
  const workspaceRoot = `/workspaces/${workspace.id}`;
  const workspaceNavigation = [
    [workspaceRoot, "Overview", LayoutDashboard],
    [`${workspaceRoot}/knowledge`, "Knowledge", Files],
    [`${workspaceRoot}/assistant`, "Workspace assistant", MessageSquare],
    [`${workspaceRoot}/members`, "Members & access", Users],
    [`${workspaceRoot}/settings`, "Workspace settings", Settings],
  ] as const;
  const links = workspaceConsole ? workspaceNavigation : navigation;
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  async function signOut() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
    } catch (e) {
      setLogoutError(errorMessage(e));
    } finally {
      setLoggingOut(false);
    }
  }

  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => { setMobile(false); window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);
  useEffect(() => {
    if (!mobile) return;
    sidebar.current?.querySelector<HTMLButtonElement>(".close-nav")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobile(false);
        requestAnimationFrame(() => menuButton.current?.focus());
      }
      if (event.key === "Tab") {
        const items = Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), select:not(:disabled)') ?? []).filter(item => item.offsetParent !== null);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobile]);
  return (
    <div className={`shell ${workspaceConsole ? "workspace-console" : "account-console"} ${collapsed ? "collapsed" : ""} ${(location.pathname === "/chat" || location.pathname.endsWith("/assistant")) ? "assistant-shell" : ""}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {mobile && (
        <button
          className="backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside ref={sidebar} className={`sidebar ${mobile ? "mobile-open" : ""}`} aria-label={workspaceConsole ? "Workspace console sidebar" : "Account sidebar"}>
        <Link to="/dashboard" className="brand">
          <span className="brand-icon">
            <Layers3 size={23} />
          </span>
          <span className="nav-label">
            Zipzipy<span className="accent">AI</span>
          </span>
        </Link>
        <button
          className="icon-button mobile-only close-nav"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X />
        </button>
        {workspaceConsole ? <>
          <Link to="/workspaces" className="console-back" title="All workspaces"><ArrowLeft size={17}/><span className="nav-label">All workspaces</span></Link>
          <div className="console-workspace-identity nav-label"><span className="console-scope-label">WORKSPACE</span><strong>{workspace.name}</strong><small>{workspace.organizationName}</small><span className="console-role"><ShieldCheck size={12}/>{workspace.role.toLowerCase()} access</span></div>
        </> : <Link to={`/workspaces/${workspace.id}`} className="workspace-label nav-label" title={`Open ${workspace.name} workspace`}><span className="workspace-icon"><Layers3 size={17}/></span><span><strong>{workspace.name}</strong><small>Open workspace console</small></span><ArrowUpRight size={14}/></Link>}
        <p className="nav-caption nav-label">{workspaceConsole ? "WORKSPACE CONSOLE" : "YOUR KNOWLEDGE HUB"}</p>
        <nav aria-label={workspaceConsole ? "Workspace navigation" : "Main navigation"}>
          {links.map(([path, label, Icon]) => (
            <NavLink title={label} key={path} to={path} end={workspaceConsole && path === workspaceRoot} onClick={() => setMobile(false)}>
              <Icon size={19}/><span className="nav-label">{label}</span>
              {!workspaceConsole && path === "/chat" && <span className="nav-label tiny-tag">AI</span>}
            </NavLink>
          ))}
        </nav>
        {workspaceConsole && <div className="console-admin-links"><p className="nav-caption nav-label">ORGANIZATION</p>
          {organizationAdmin && <Link to={`/organizations/${workspace.organizationId}/members`} title="Organization members"><Building2 size={17}/><span className="nav-label">Organization members</span><ArrowUpRight className="nav-label" size={13}/></Link>}
          <Link to="/chat" title="Personal assistant"><MessageSquare size={17}/><span className="nav-label">Personal assistant</span><ArrowUpRight className="nav-label" size={13}/></Link>
        </div>}
        <div className="sidebar-bottom">
          {workspaceConsole ? <div className="console-scope-note nav-label"><ShieldCheck size={17}/><p>Knowledge and conversations are scoped to this workspace.</p></div> : <div className="foundation nav-label"><Layers3 size={22}/><h4>Your knowledge, organized</h4><p>Open a workspace for focused knowledge and collaboration.</p><Link to="/workspaces">Explore workspaces <ArrowUpRight size={14}/></Link></div>}
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <PanelLeftClose size={18} />
            <span className="nav-label">Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className="main-shell" inert={mobile}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              ref={menuButton}
              aria-label="Open navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            {workspaceConsole ? <div className="console-project-picker"><Layers3 size={18}/><label htmlFor="console-workspace"><span>Workspace</span><select id="console-workspace" value={workspace.id} onChange={e => select(e.target.value)}>{Array.from(new Set(workspaces.map(item => item.organizationId))).map(organizationId => <optgroup key={organizationId} label={workspaces.find(item => item.organizationId === organizationId)?.organizationName}>{workspaces.filter(item => item.organizationId === organizationId).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>)}</select></label></div> : <Breadcrumbs/>}
          </div>
          <div className="top-actions">
            {!workspaceConsole && <span className="search-visual" title="Global search is planned">
              <Search size={16} /> Search knowledge <kbd>soon</kbd>
            </span>}
            <button
              className="icon-button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <NotificationPanel />
            <span className="avatar" title={user?.email}>
              {user?.firstName?.[0]?.toUpperCase() ||
                user?.email[0].toUpperCase()}
            </span>
            <button
              className="icon-button"
              aria-label="Sign out"
              disabled={loggingOut}
              onClick={() => void signOut()}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        {workspaceConsole && <div className="console-location-bar"><Breadcrumbs/><span className="console-location-label">{workspace.personal ? "Personal workspace" : "Team workspace"}</span></div>}
        <main id="main" tabIndex={-1}>
          {logoutError && <ErrorState message={logoutError} />}
          <Outlet />
        </main>
        <footer>
          Zipzipy AI{" "}
          <span>
            Foundation · Signed in as {user?.firstName || user?.email}
          </span>
        </footer>
      </div>
    </div>
  );
}
