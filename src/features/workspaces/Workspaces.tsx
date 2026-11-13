import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Layers3, ArrowUpRight, Plus } from "lucide-react";
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
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
  const [filter, setFilter] = useState("");
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
      <header className="page-heading">
        <div>
          <p className="eyebrow">ORGANIZE YOUR KNOWLEDGE</p>
          <h1>Workspaces</h1>
          <p>Independent knowledge spaces within your organizations.</p>
        </div>
        <Button className="primary" onClick={() => setCreating(!creating)}>
          <Plus size={16} />
          Create workspace
        </Button>
      </header>
      <div className="workspace-organization-bar">
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
        {workspaces
          .filter((w) => !filter || w.organizationId === filter)
          .map((w) => (
            <Card key={w.id} className="workspace-tile">
              <div className="section-heading">
                <span className="workspace-tile-icon">
                  <Layers3 size={20} />
                </span>
                <span className="badge">{w.role.toLowerCase()}</span>
              </div>
              <small className="muted">{w.organizationName}</small>
              <h2>{w.name}</h2>
              <p>{w.description || "A focused space for shared knowledge."}</p>
              <div className="workspace-tile-meta">
                <span>{w.documentCount} documents</span>
                <span>{w.memberCount} members</span>
              </div>
              <Button onClick={() => select(w.id)}>
                Open workspace <ArrowUpRight size={15} />
              </Button>
            </Card>
          ))}
      </div>
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
  });
  const add = useMutation({
    mutationFn: workspaceApi.addOrganizationMember,
    onSuccess: async () => {
      setEmail("");
      await cache.invalidateQueries({
        queryKey: ["organization-members", organization.id],
      });
    },
  });
  return (
    <Card>
      <details onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>{organization.name} · Organization members</summary>
        <p className="muted">
          Add a registered account, then assign its workspace role in a
          workspace's Members tab. No invitation email is sent.
        </p>
        <form
          className="workspace-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!add.isPending) add.mutate({ id: organization.id, email });
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
          <Button disabled={add.isPending}>Add member</Button>
        </form>
        {add.isError && <ErrorState message={errorMessage(add.error)} />}{" "}
        {add.isSuccess && (
          <p role="status">
            Organization membership saved. Workspace access is assigned
            separately.
          </p>
        )}
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
      </details>
    </Card>
  );
}
