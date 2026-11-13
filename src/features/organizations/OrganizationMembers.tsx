import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail, Search, ShieldCheck, Users, UserMinus, ArrowLeft } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { Button, Card, EmptyState, ErrorState, Input, LoadingState } from "../../components/ui";
import { errorMessage } from "../../lib/api/client";
import { workspaceApi, type Organization } from "../workspaces/api";
import { notificationApi } from "../notifications/api";
import { organizationApi, type OrganizationRole } from "./api";
import "./organizations.css";

export function OrganizationMembers() {
  const { organizationId } = useParams();
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: workspaceApi.organizations, refetchInterval: 30000 });
  if (organizations.isPending) return <LoadingState/>;
  if (organizations.isError) return <ErrorState message={errorMessage(organizations.error)} retry={() => void organizations.refetch()}/>;
  const organization = organizations.data.find(org => org.id === organizationId);
  if (!organization) return <EmptyState title="Organization unavailable"><Link to="/organizations">Return to organizations</Link></EmptyState>;
  if (organization.role !== "ADMIN") return <EmptyState title="Administrator access required">Only organization admins can manage membership. <Link to="/organizations">Return to organizations</Link></EmptyState>;
  return <MemberManagement key={organization.id} organization={organization}/>;
}

function MemberManagement({ organization }: { organization: Organization }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [notice, setNotice] = useState("");
  const members = useQuery({ queryKey: ["organization-members", organization.id], queryFn: () => organizationApi.members(organization.id), refetchInterval: 30000 });
  const invitations = useQuery({ queryKey: ["organization-invitations", organization.id], queryFn: () => notificationApi.sent(organization.id), refetchInterval: 30000 });
  async function refresh() {
    // Clear protected data as well as roster caches when this account's permissions change.
    await Promise.all(["organization-members", "organization-invitations", "organizations", "workspaces", "workspace-members", "notifications", "documents", "folders", "conversations", "messages", "conversation-documents"].map(key => cache.invalidateQueries({ queryKey: [key] })));
  }
  const invite = useMutation({ mutationFn: workspaceApi.addOrganizationMember, onSuccess: async data => {
    setEmail(""); setNotice(data.emailStatus === "DISABLED" ? "Invitation created. Email is disabled; the recipient can respond in their notifications." : "Invitation created and email queued. Membership is pending acceptance."); await refresh();
  } });
  const role = useMutation({ mutationFn: organizationApi.changeRole, onSuccess: async (_, variables) => {
    setNotice("Organization role updated. Workspace roles are unchanged.");
    if (variables.userId === user?.id && variables.role !== "ADMIN") navigate("/organizations");
    await refresh();
  } });
  const remove = useMutation({ mutationFn: organizationApi.remove, onSuccess: async (_, variables) => {
    setNotice("Member removed. Their access to all workspaces in this organization has been revoked.");
    if (variables.userId === user?.id) navigate("/organizations");
    await refresh();
  } });
  const cancel = useMutation({ mutationFn: notificationApi.cancel, onSuccess: async () => { setNotice("Invitation cancelled. It can no longer be accepted."); await refresh(); } });
  const retry = useMutation({ mutationFn: notificationApi.retryEmail, onSuccess: async () => { setNotice("Invitation email queued for delivery."); await refresh(); } });
  const busy = role.isPending || remove.isPending || cancel.isPending || invite.isPending || retry.isPending;
  const managementSupported = members.isSuccess && members.data.every(member => typeof member.workspaceCount === "number");
  const admins = members.data?.filter(member => member.role === "ADMIN").length ?? 0;
  const visible = members.data?.filter(member => (!roleFilter || member.role === roleFilter) && `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  const pending = invitations.data?.filter(invitation => invitation.status === "PENDING").length;
  function resetFeedback() { setNotice(""); role.reset(); remove.reset(); cancel.reset(); invite.reset(); retry.reset(); }
  return <div className="organization-page workspace-page">
    <header className="organization-heading"><div className="organization-directory-icon"><Building2 size={24}/></div><div><Link to="/organizations" className="organization-back"><ArrowLeft size={13}/> Organizations</Link><h1>{organization.name}</h1><p>People & access</p></div><span className="badge">Organization admin</span></header>
    <div className="organization-summary"><span><Users size={18}/><strong>{members.data?.length ?? "—"}</strong> active members</span><span><ShieldCheck size={18}/><strong>{members.data ? admins : "—"}</strong> administrators</span><span><Mail size={18}/><strong>{pending ?? "—"}</strong> pending in latest 100 invitations</span></div>
    {members.isSuccess && !managementSupported && <p className="notice">Rebuild the backend to enable organization role changes, removal and invitation cancellation. Your existing members are shown below.</p>}
    {notice && <p className="organization-success" role="status">{notice}</p>}
    {[role, remove, cancel, invite, retry].map((mutation, index) => mutation.isError && <ErrorState key={index} message={errorMessage(mutation.error)}/>)}
    <Card className="organization-roster-card"><div className="organization-section-heading"><div><h2>Organization members</h2><p>Admins manage people and create workspaces. Members receive workspace access separately.</p></div></div>
      <div className="organization-filters"><label className="workspace-search"><Search size={16}/><input aria-label="Search organization members" placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)}/></label><select aria-label="Filter organization role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option value="">All roles</option><option value="ADMIN">Admin</option><option value="MEMBER">Member</option></select></div>
      {members.isPending ? <LoadingState/> : members.isError ? <ErrorState message={errorMessage(members.error)} retry={() => void members.refetch()}/> : visible.length === 0 ? <EmptyState title="No matching members">Try another name, email or role.</EmptyState> : <div className="table-scroll"><table className="organization-roster"><thead><tr><th scope="col">Member</th><th scope="col">Organization role</th><th scope="col">Workspace access</th><th scope="col">Actions</th></tr></thead><tbody>{visible.map(member => {
        const protectedMember = member.userId === organization.id || (member.role === "ADMIN" && admins <= 1);
        const protection = member.userId === organization.id ? "Personal organization owner" : "Last organization admin";
        return <tr key={member.userId}><td><div className="organization-person"><span className="organization-person-avatar">{member.firstName[0]}{member.lastName[0]}</span><div><strong>{member.firstName} {member.lastName}{member.userId === user?.id && <small className="organization-you">You</small>}</strong><small>{member.email}</small></div></div></td>
          <td><select aria-label={`Organization role for ${member.email}`} value={member.role} disabled={busy || protectedMember || !managementSupported} title={protectedMember ? protection : undefined} onChange={e => {
            const nextRole = e.target.value as OrganizationRole;
            const explanation = nextRole === "ADMIN" ? "They will be able to invite and remove organization members and create workspaces." : "They will lose organization administration access. Their pending invitations will be cancelled; their workspace roles will remain unchanged.";
            if (window.confirm(`Change ${member.email} to ${nextRole.toLowerCase()}? ${explanation}`)) { resetFeedback(); role.mutate({ id: organization.id, userId: member.userId, role: nextRole }); }
          }}><option value="ADMIN">Admin</option><option value="MEMBER">Member</option></select>{protectedMember && <small className="organization-protected">{protection}</small>}</td>
          <td>{member.workspaceCount ?? "—"} workspaces</td><td><Button disabled={busy || protectedMember || !managementSupported} title={protectedMember ? protection : "Revoke organization and workspace access"} onClick={() => {
            if (window.confirm(`Remove ${member.email} from ${organization.name}? They will lose access to every workspace in this organization, including their workspace chats. Documents and conversations will be retained. They must accept a new invitation to rejoin.`)) { resetFeedback(); remove.mutate({ id: organization.id, userId: member.userId }); }
          }}><UserMinus size={14}/> Remove</Button></td></tr>;
      })}</tbody></table></div>}
    </Card>
    <Card><div className="organization-section-heading"><div><h2>Invite a member</h2><p>Send an invitation to a registered account. They decide whether to join.</p></div><Mail size={21}/></div>
      <form className="workspace-inline-form" onSubmit={e => { e.preventDefault(); if (!busy && invitations.isSuccess) { resetFeedback(); invite.mutate({ id: organization.id, email: email.trim() }); } }}><Input aria-label="Invite member email" type="email" maxLength={254} placeholder="Registered account email" required value={email} onChange={e => setEmail(e.target.value)}/><Button className="primary" disabled={busy || !invitations.isSuccess}>{invite.isPending ? "Inviting…" : "Send invitation"}</Button></form>
      {invitations.isError && <ErrorState message="Invitations are unavailable. Check your access and that the updated backend is running." retry={() => void invitations.refetch()}/>}
      <div className="organization-section-heading"><h3>Invitation history</h3><small>Latest 100</small></div>
      {invitations.isPending ? <LoadingState/> : invitations.data?.length ? <div className="table-scroll"><table className="organization-roster"><thead><tr><th scope="col">Recipient</th><th scope="col">Status</th><th scope="col">Email</th><th scope="col">Actions</th></tr></thead><tbody>{invitations.data.map(invitation => <tr key={invitation.id}><td>{invitation.recipientEmail}<small className="muted block">Invited {new Date(invitation.createdAt).toLocaleDateString()}</small></td><td><span className={`invitation-status status-${invitation.status.toLowerCase()}`}>{invitation.status === "REJECTED" ? "Declined" : invitation.status.toLowerCase()}</span></td><td>{({ SENT: "Submitted to mail server", QUEUED: "Queued", PROCESSING: "Sending", FAILED: "Failed", DISABLED: "Disabled", CANCELLED: "Cancelled" })[invitation.emailStatus]}</td><td><div className="organization-row-actions">{invitation.status === "PENDING" && <><Button disabled={busy || !managementSupported} onClick={() => { if (window.confirm(`Cancel the invitation to ${invitation.recipientEmail}?`)) { resetFeedback(); cancel.mutate({ organization: organization.id, id: invitation.id }); } }}>Cancel invite</Button>{["FAILED", "DISABLED"].includes(invitation.emailStatus) && <Button disabled={busy} onClick={() => { resetFeedback(); retry.mutate({ organization: organization.id, id: invitation.id }); }}>Retry email</Button>}</>}</div></td></tr>)}</tbody></table></div> : !invitations.isError && <p className="muted">No invitations yet.</p>}
    </Card>
    <p className="organization-note"><ShieldCheck size={16}/> An organization must retain an admin. Before removing the only admin of a workspace, assign another workspace admin.</p>
  </div>;
}
