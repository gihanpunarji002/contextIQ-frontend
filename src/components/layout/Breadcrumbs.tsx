import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../../features/workspaces/api";
import { ChevronRight } from "lucide-react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";

export function Breadcrumbs() {
  const { workspace } = useWorkspace();
  const { pathname, search } = useLocation();
  const organizationId = pathname.match(/^\/organizations\/([^/]+)/)?.[1] ?? new URLSearchParams(search).get("organization");
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: workspaceApi.organizations, enabled: !!organizationId });
  const organization = organizations.data?.find(item => item.id === organizationId);
  const root = `/workspaces/${workspace.id}`;
  const trail: { label: string; to?: string }[] = [{ label: "Home", to: "/dashboard" }];
  if (pathname.startsWith("/workspaces/")) {
    trail.push({ label: "Workspaces", to: "/workspaces" }, { label: workspace.organizationName, to: `/workspaces?organization=${workspace.organizationId}` }, { label: workspace.name, to: root });
    const tab = pathname.split("/")[3];
    trail.push({ label: ({ knowledge: "Knowledge", assistant: "Workspace assistant", members: "Members", settings: "Settings" } as Record<string, string>)[tab] || "Overview" });
  } else if (pathname.startsWith("/organizations/")) {
    trail.push({ label: "Organizations", to: "/organizations" }, { label: organization?.name || "Organization" }, { label: "Members & access" });
  } else if (pathname === "/documents") {
    trail.push({ label: "Workspaces", to: "/workspaces" }, { label: workspace.name, to: root }, { label: "Documents" });
  } else {
    const titles: Record<string, string> = { "/dashboard": "Overview", "/chat": "Personal AI Assistant", "/workspaces": "Workspaces", "/settings": "Settings", "/organizations": "Organizations" };
    trail.push({ label: titles[pathname] || "Zipzipy AI" });
    if (pathname === "/workspaces" && organization) {
      trail[1].to = "/workspaces"; trail.push({ label: organization.name });
    }
  }
  return <nav className="page-breadcrumbs" aria-label="Breadcrumb"><ol>{trail.map((item, index) => <li key={index}>
    {index > 0 && <ChevronRight size={12} aria-hidden="true" />}{index === trail.length - 1 ? <span aria-current="page">{item.label}</span> : item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
  </li>)}</ol></nav>;
}
