import { useState } from "react";
import { useSearchParams } from "react-router";
import { notificationApi } from "../notifications/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Layers3, ArrowUpRight, Plus, Search, Files, Users, LockKeyhole, Mail } from "lucide-react";
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  EmptyState,
} from "../../components/ui";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { workspaceApi, type Organization } from "./api";
import { errorMessage } from "../../lib/api/client";
import "./workspaces.css";

export function Workspaces() {
  const { workspaces, select } = useWorkspace();
  const cache = useQueryClient();
  const organizations = useQuery({
    queryKey: ["organizations"],
    queryFn: workspaceApi.organizations,
  });
  const [params, setParams] = useSearchParams();
  const filter = params.get("organization") || "";
  const [search, setSearch] = useState("");
  function setFilter(value: string) { setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set("organization", value); else next.delete("organization"); return next; }); }
  const visible = workspaces.filter(w => (!filter || w.organizationId === filter) && `${w.name} ${w.description} ${w.organizationName}`.toLowerCase().includes(search.toLowerCase()));
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const newOrg = useMutation({
    mutationFn: workspaceApi.createOrganization,
    onSuccess: async (o) => {
      setOrgName("");
      setOrgId(o.id);
      await cache.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
  const create = useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: async (w) => {
      await cache.invalidateQueries({ queryKey: ["workspaces"] });
      setCreating(false);
      select(w.id);
    },
  });
  return (
    <div className="workspace-page">
      <header className="page-heading workspace-hero">
        <div>
          <p className="eyebrow">YOUR TEAM’S KNOWLEDGE, TOGETHER</p>
          <h1>Workspaces</h1>
          <p>Focused spaces for your teams, documents and ideas.</p>
        </div>
        <Button className="primary" aria-expanded={creating} onClick={() => setCreating(!creating)}>
          <Plus size={16} />
          Create workspace
        </Button>
      </header>
      <div className="workspace-overview-strip">
        <span><Layers3 size={17} /><strong>{workspaces.length}</strong> accessible workspaces</span>
        <span><Building2 size={17} /><strong>{organizations.data?.length ?? "—"}</strong> organizations</span>
        <span><LockKeyhole size={16} /> Knowledge stays within its workspace</span>
      </div>
      <div className="workspace-organization-bar">
        <label className="workspace-search"><Search size={16} /><input aria-label="Search workspaces" placeholder="Search workspaces…" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <Building2 size={18} />
        <label>
          Organization{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All organizations</option>
            {organizations.data?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {organizations.isError && (
        <ErrorState
          message={errorMessage(organizations.error)}
          retry={() => void organizations.refetch()}
        />
      )}
      {creating && (
        <Card>
          <h2>Create a workspace</h2>
          <form
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!create.isPending)
                create.mutate({ organizationId: orgId, name, description });
            }}
          >
            <label>
              Organization
              <select
                required
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                <option value="">Choose an organization you administer</option>
                {organizations.data
                  ?.filter((o) => o.role === "ADMIN")
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Name
              <Input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Human Resources"
              />
            </label>
            <label>
              Description
              <Input
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Purpose and scope of this knowledge space"
              />
            </label>
            {create.isError && (
              <ErrorState message={errorMessage(create.error)} />
            )}
            <div>
              <Button
                type="submit"
                className="primary"
                disabled={!name.trim() || !orgId || create.isPending}
              >
                {create.isPending ? "Creating…" : "Create workspace"}
              </Button>{" "}
              <Button type="button" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      <div className="workspace-grid">
        {visible.map((w, index) => (
            <Card key={w.id} className={`workspace-tile tone-${index % 3}`}>
              <div className="section-heading">
                <span className="workspace-tile-icon">
                  {w.personal ? <LockKeyhole size={21} /> : <Layers3 size={21} />}
                </span>
                <span className="badge">{w.role.toLowerCase()}</span>
              </div>
              <small className="workspace-org-name">{w.personal ? "PERSONAL SPACE" : w.organizationName}</small>
              <h2>{w.name}</h2>
              <p>{w.description || "A focused space for shared knowledge."}</p>
              <div className="workspace-tile-meta">
                <span><Files size={14} />{w.documentCount} {w.documentCount === 1 ? "document" : "documents"}</span>
                <span><Users size={14} />{w.memberCount} {w.memberCount === 1 ? "member" : "members"}</span>
              </div>
              <Button onClick={() => select(w.id)}>
                Open workspace <ArrowUpRight size={15} />
              </Button>
            </Card>
          ))}
      </div>
      {visible.length === 0 && <EmptyState title="No workspaces found">Try another search or organization. After accepting an invitation, an admin must assign you a workspace role.</EmptyState>}
      <div className="workspace-section-title"><div><h2>Organization management</h2><p>Bring people together, then assign access to individual workspaces.</p></div><Building2 size={22} /></div>
      <Card>
        <details>
          <summary>Create an organization</summary>
          <p className="muted">
            An organization can contain multiple workspaces. Organization
            membership alone does not grant access to their knowledge.
          </p>
          <form
            className="workspace-inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newOrg.isPending) newOrg.mutate(orgName);
            }}
          >
            <Input
              aria-label="Organization name"
              required
              maxLength={80}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
            />
            <Button disabled={!orgName.trim() || newOrg.isPending}>
              Create organization
            </Button>
          </form>
          {newOrg.isError && (
            <ErrorState message={errorMessage(newOrg.error)} />
          )}
          {newOrg.isSuccess && (
            <p role="status">
              Organization created. You can now create its workspaces.
            </p>
          )}
        </details>
      </Card>
      {organizations.data
        ?.filter((o) => o.role === "ADMIN" && (!filter || o.id === filter))
        .map((o) => (
          <OrganizationMembers key={o.id} organization={o} />
        ))}
    </div>
  );
}
function OrganizationMembers({ organization }: { organization: Organization }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const cache = useQueryClient();
  const members = useQuery({
    queryKey: ["organization-members", organization.id],
    queryFn: () => workspaceApi.organizationMembers(organization.id),
    enabled: open,
    refetchInterval: open ? 30000 : false,
  });
  const add = useMutation({
    mutationFn: workspaceApi.addOrganizationMember,
    onSuccess: async () => {
      setEmail("");
      await cache.invalidateQueries({ queryKey: ["organization-invitations", organization.id] });
    },
  });
  const invitations = useQuery({ queryKey: ["organization-invitations", organization.id], queryFn: () => notificationApi.sent(organization.id), enabled: open, refetchInterval: open ? 30000 : false });
  const retry = useMutation({ mutationFn: notificationApi.retryEmail, onSuccess: () => cache.invalidateQueries({ queryKey: ["organization-invitations", organization.id] }) });
  return (
    <Card>
      <details onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>{organization.name} · Organization members</summary>
        <p className="muted">
          Invite a registered account. They must accept in their account notifications before you can assign a workspace role. Email is sent when SMTP is enabled.
        </p>
        {invitations.isError && <p className="notice">Invitations are unavailable. Refresh your access or update the backend before inviting members.</p>}
        <form
          className="workspace-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!add.isPending && invitations.isSuccess) add.mutate({ id: organization.id, email });
          }}
        >
          <Input
            type="email"
            required
            aria-label={`Member email for ${organization.name}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Registered account email"
          />
          <Button disabled={add.isPending || !invitations.isSuccess}><Mail size={15} /> {add.isPending ? "Inviting…" : "Invite member"}</Button>
        </form>
        {add.isError && <ErrorState message={errorMessage(add.error)} />}{" "}
        {add.isSuccess && (
          <p role="status">
            Invitation created. Membership is pending their acceptance.{add.data?.emailStatus === "DISABLED" ? " Email is disabled; the invitation is available in their notification panel." : " Email is queued for delivery."}
          </p>
        )}
        <h3 className="workspace-subheading">Active members</h3>
        {members.isLoading ? (
          <LoadingState />
        ) : members.isError ? (
          <ErrorState message={errorMessage(members.error)} />
        ) : (
          <ul className="workspace-member-list">
            {members.data?.map((m) => (
              <li key={m.userId}>
                <span>
                  {m.firstName} {m.lastName}
                  <small>{m.email}</small>
                </span>
                <span className="badge">{m.role.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        )}
        <h3 className="workspace-subheading">Invitations <small>Latest 100</small></h3>
        {retry.isError && <ErrorState message={errorMessage(retry.error)} />}
        {invitations.isLoading ? <LoadingState /> : invitations.isError ? <ErrorState message={errorMessage(invitations.error)} retry={() => void invitations.refetch()} /> : invitations.data?.length ? <ul className="workspace-member-list invitation-roster">{invitations.data.map(invite => <li key={invite.id}>
          <span>{invite.recipientEmail}<small>Invited {new Date(invite.createdAt).toLocaleDateString()} · Email: {({ DISABLED: "disabled", QUEUED: "queued", PROCESSING: "sending", SENT: "submitted to mail server", FAILED: "delivery failed", CANCELLED: "cancelled" })[invite.emailStatus]}</small></span>
          <span className="invitation-roster-actions"><span className={`invitation-status status-${invite.status.toLowerCase()}`}>{invite.status === "REJECTED" ? "Declined" : invite.status}</span>{invite.status === "PENDING" && ["DISABLED", "FAILED"].includes(invite.emailStatus) && <Button disabled={retry.isPending} onClick={() => retry.mutate({ organization: organization.id, id: invite.id })}>Retry email</Button>}</span>
        </li>)}</ul> : <p className="muted">No invitations yet.</p>}
      </details>
    </Card>
  );
}
