import {
  Building2,
  Files,
  FolderOpen,
  Users,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useParams, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
} from "../../components/ui";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { Documents } from "../documents/Documents";
import { Chat } from "../chat/Chat";
import { workspaceApi, type WorkspaceRole } from "./api";
import { errorMessage } from "../../lib/api/client";
import "./workspaces.css";

export function WorkspaceDetail() {
  const { workspace } = useWorkspace();
  return <Detail key={workspace.id} />;
}
function Detail() {
  const { workspace, canAdmin } = useWorkspace();
  const { tab } = useParams();
  const root = `/workspaces/${workspace.id}`;
  return (
    <div
      className={`workspace-page ${tab === "assistant" ? "workspace-chat-page" : ""}`}
    >
      <header className="workspace-detail-heading">
        <div className="workspace-detail-identity">
          <span className="workspace-detail-icon">
            <Building2 size={29} />
          </span>
          <div>
            <span className="workspace-org-name">
              {workspace.organizationName}
            </span>
            <h1>{workspace.name}</h1>
            <p>
              {workspace.description ||
                "A focused space for knowledge and collaboration."}
            </p>
          </div>
        </div>
        <div className="workspace-detail-labels">
          <span className="badge">
            <ShieldCheck size={13} /> {workspace.role.toLowerCase()} access
          </span>
          <span className="muted">
            {workspace.personal ? "Personal workspace" : "Team workspace"}
          </span>
        </div>
      </header>
      <nav className="workspace-tabs" aria-label="Workspace sections">
        {[
          ["", "Overview"],
          ["knowledge", "Knowledge"],
          ["assistant", "Workspace assistant"],
          ["members", "Members"],
          ["settings", "Settings"],
        ].map(([path, label]) => (
          <NavLink key={path} end to={`${root}${path ? `/${path}` : ""}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      {!tab ? (
        <>
          <div className="workspace-stats">
            <Card>
              <span>
                <Files size={18} /> Documents
              </span>
              <strong>{workspace.documentCount}</strong>
              <small>Available in this workspace</small>
            </Card>
            <Card>
              <span>
                <FolderOpen size={18} /> Folders
              </span>
              <strong>{workspace.folderCount}</strong>
              <small>Organized knowledge collections</small>
            </Card>
            <Card>
              <span>
                <Users size={18} /> Members
              </span>
              <strong>{workspace.memberCount}</strong>
              <small>People with workspace access</small>
            </Card>
          </div>
          <div className="workspace-launchpad">
            <Link to={`${root}/knowledge`}>
              <span className="workspace-launch-icon">
                <FolderOpen size={23} />
              </span>
              <h2>Explore your knowledge</h2>
              <p>
                Browse documents, organize folders and find the context your
                team needs.
              </p>
              <span>
                Open knowledge library <ArrowUpRight size={16} />
              </span>
            </Link>
            <Link to={`${root}/assistant`}>
              <span className="workspace-launch-icon">
                <Sparkles size={23} />
              </span>
              <h2>Ask your workspace</h2>
              <p>
                Choose files or folders from {workspace.name} and ask questions
                with supporting sources.
              </p>
              <span>
                Open workspace assistant <ArrowUpRight size={16} />
              </span>
            </Link>
          </div>
          <div className="workspace-boundary-note">
            <ShieldCheck size={18} />
            <p>
              Only members with workspace access can retrieve its knowledge.
              Your conversations remain private to you.
            </p>
          </div>
        </>
      ) : tab === "knowledge" ? (
        <Documents />
      ) : tab === "assistant" ? (
        <Chat variant="workspace" />
      ) : tab === "members" ? (
        canAdmin ? (
          <Members />
        ) : (
          <Card>
            <h2>Members</h2>
            <p>
              Workspace admins manage membership. Your role is{" "}
              {workspace.role.toLowerCase()}.
            </p>
          </Card>
        )
      ) : tab === "settings" ? (
        canAdmin ? (
          <Settings />
        ) : (
          <Card>
            <h2>Settings</h2>
            <p>Workspace settings require Admin access.</p>
          </Card>
        )
      ) : (
        <Card>
          <h2>Section not found</h2>
          <Link to={root}>Return to overview</Link>
        </Card>
      )}
    </div>
  );
}
function Members() {
  const { workspace } = useWorkspace();
  const cache = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("VIEWER");
  const members = useQuery({
    queryKey: ["workspace-members", workspace.id],
    queryFn: () => workspaceApi.members(workspace.id),
  });
  const refresh = async () => {
    await Promise.all([
      cache.invalidateQueries({
        queryKey: ["workspace-members", workspace.id],
      }),
      cache.invalidateQueries({ queryKey: ["workspaces"] }),
    ]);
  };
  const save = useMutation({
    mutationFn: workspaceApi.setMember,
    onSuccess: async () => {
      setEmail("");
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: workspaceApi.removeMember,
    onSuccess: refresh,
  });
  return (
    <Card>
      <h2>Workspace members</h2>
      <p className="muted">
        Admins manage members and settings. Editors manage knowledge. Viewers
        read documents and ask questions.
      </p>
      {workspace.personal ? (
        <p>
          Personal workspaces cannot be shared. Create a team workspace to
          collaborate.
        </p>
      ) : (
        <form
          className="workspace-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!save.isPending) save.mutate({ id: workspace.id, email, role });
          }}
        >
          <Input
            type="email"
            required
            aria-label="Workspace member email"
            placeholder="Accepted organization member’s email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            aria-label="New member role"
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
          >
            {["VIEWER", "EDITOR", "ADMIN"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <Button disabled={save.isPending}>Add member</Button>
        </form>
      )}
      {save.isError && <ErrorState message={errorMessage(save.error)} />}{" "}
      {remove.isError && <ErrorState message={errorMessage(remove.error)} />}
      {members.isPending ? (
        <LoadingState />
      ) : members.isError ? (
        <ErrorState
          message={errorMessage(members.error)}
          retry={() => void members.refetch()}
        />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.data.map((m) => (
                <tr key={m.userId}>
                  <td>
                    {m.firstName} {m.lastName}
                    <small className="muted block">{m.email}</small>
                  </td>
                  <td>
                    <select
                      aria-label={`Role for ${m.email}`}
                      value={m.role}
                      disabled={
                        workspace.personal || save.isPending || remove.isPending
                      }
                      onChange={(e) =>
                        save.mutate({
                          id: workspace.id,
                          email: m.email,
                          role: e.target.value as WorkspaceRole,
                        })
                      }
                    >
                      {["ADMIN", "EDITOR", "VIEWER"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Button
                      disabled={
                        workspace.personal || save.isPending || remove.isPending
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${m.email} from this workspace? They will lose access to its knowledge and their workspace chats.`,
                          )
                        )
                          remove.mutate({ id: workspace.id, userId: m.userId });
                      }}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
function Settings() {
  const { workspace } = useWorkspace();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const save = useMutation({
    mutationFn: workspaceApi.update,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["workspaces"] }),
  });
  const remove = useMutation({
    mutationFn: workspaceApi.remove,
    onSuccess: async () => {
      navigate("/workspaces");
      await cache.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
  return (
    <>
      <Card>
        <h2>Workspace settings</h2>
        <form
          className="workspace-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!save.isPending)
              save.mutate({ id: workspace.id, name, description });
          }}
        >
          <label>
            Name
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Description
            <Input
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <Button className="primary" disabled={save.isPending}>
            Save changes
          </Button>
        </form>
        {save.isError && <ErrorState message={errorMessage(save.error)} />}{" "}
        {save.isSuccess && <p role="status">Workspace updated.</p>}
      </Card>
      {!workspace.personal && (
        <Card>
          <h2>Delete workspace</h2>
          <p>
            This revokes access for all members. Stored records are retained;
            deletion does not permanently purge documents or conversations.
          </p>
          <Button
            disabled={remove.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `Delete ${workspace.name}? All members will lose access.`,
                )
              )
                remove.mutate(workspace.id);
            }}
          >
            Delete workspace
          </Button>
          {remove.isError && (
            <ErrorState message={errorMessage(remove.error)} />
          )}
        </Card>
      )}
    </>
  );
}
