import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router";
import {
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
import { useTheme } from "../../app/providers/ThemeProvider";
import { useAuth } from "../../app/providers/AuthProvider";
import { errorMessage } from "../../lib/api/client";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { ErrorState } from "../ui";
const navigation = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/chat", "AI Assistant", MessageSquare],
  ["/documents", "Documents", Files],
  ["/workspaces", "Workspaces", Users],
  ["/settings", "Settings", Settings],
] as const;
export function AppShell() {
  const { workspace, workspaces, select } = useWorkspace();
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
  useEffect(() => {
    if (!mobile) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobile(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobile]);
  const title =
    navigation.find(([path]) => location.pathname === path)?.[1] || (location.pathname.startsWith("/workspaces/") ? "Workspace" : "Zipzipy AI");
  return (
    <div className={`shell ${collapsed ? "collapsed" : ""} ${(location.pathname === "/chat" || location.pathname.endsWith("/assistant")) ? "assistant-shell" : ""}`}>
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
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
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
        <div className="workspace-label nav-label">
          <span className="workspace-icon">C</span>
          <div>
            <label className="sr-only" htmlFor="active-workspace">Active workspace</label>
            <select id="active-workspace" value={workspace.id} onChange={e => select(e.target.value)} style={{ maxWidth: "155px", background: "transparent", color: "inherit" }}>
              {workspaces.map(w => <option key={w.id} value={w.id}>{w.organizationName} / {w.name}</option>)}
            </select><small>{workspace.role.toLowerCase()} · {workspace.organizationName}</small>
          </div>
        </div>
        <p className="nav-caption nav-label">YOUR KNOWLEDGE HUB</p>
        <nav aria-label="Main navigation">
          {navigation.map(([path, label, Icon]) => (
            <NavLink
              title={label}
              key={path}
              to={path}
              onClick={() => setMobile(false)}
            >
              <Icon size={19} />
              <span className="nav-label">{label}</span>
              {path === "/chat" && (
                <span className="nav-label tiny-tag">AI</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="foundation nav-label">
            <Layers3 size={22} />
            <h4>A foundation for what's next</h4>
            <p>Your connected knowledge platform, taking shape.</p>
            <Link to="/settings">
              Explore the foundation <ArrowUpRight size={14} />
            </Link>
          </div>
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
      <div className="main-shell">
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
            <span>{workspace.name}</span>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <div className="top-actions">
            <span className="search-visual" title="Global search is planned">
              <Search size={16} /> Search knowledge <kbd>soon</kbd>
            </span>
            <button
              className="icon-button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
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
