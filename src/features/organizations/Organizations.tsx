import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { workspaceApi } from "../workspaces/api";
import { Button, Card, ErrorState, Input, LoadingState } from "../../components/ui";
import { errorMessage } from "../../lib/api/client";
import "./organizations.css";

export function Organizations() {
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: workspaceApi.organizations });
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const cache = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({ mutationFn: workspaceApi.createOrganization, onSuccess: async org => {
    await cache.invalidateQueries({ queryKey: ["organizations"] }); navigate(`/organizations/${org.id}/members`);
  } });
  return <div className="organization-page workspace-page">
    <header className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Organizations</h1><p>Manage your people and the organizations they belong to.</p></div><Button className="primary" aria-expanded={creating} onClick={() => setCreating(!creating)}><Plus size={16}/> Create organization</Button></header>
    {creating && <Card><h2>New organization</h2><form className="workspace-inline-form" onSubmit={e => { e.preventDefault(); if (!create.isPending) create.mutate(name.trim()); }}><Input aria-label="Organization name" required maxLength={80} placeholder="Organization name" value={name} onChange={e => setName(e.target.value)}/><Button className="primary" disabled={!name.trim() || create.isPending}>{create.isPending ? "Creating…" : "Create"}</Button></form>{create.isError && <ErrorState message={errorMessage(create.error)}/>}</Card>}
    {organizations.isPending ? <LoadingState/> : organizations.isError ? <ErrorState message={errorMessage(organizations.error)} retry={() => void organizations.refetch()}/> : <div className="organization-directory">{organizations.data.map(org => <Card key={org.id} className="organization-directory-card"><div className="organization-directory-icon"><Building2 size={23}/></div><div><h2>{org.name}</h2><p><ShieldCheck size={13}/> Organization {org.role.toLowerCase()}</p></div><div className="organization-directory-actions"><Link className="button" to={`/workspaces?organization=${org.id}`}>View workspaces</Link>{org.role === "ADMIN" && <Link className="button" to={`/organizations/${org.id}/members`}>Manage members <ArrowRight size={14}/></Link>}</div></Card>)}</div>}
    <p className="organization-note"><ShieldCheck size={16}/> Organization membership and workspace access are managed separately. Members must accept their invitation before receiving workspace access.</p>
  </div>;
}
