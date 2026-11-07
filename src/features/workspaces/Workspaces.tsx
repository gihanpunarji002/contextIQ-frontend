import { Users, Plus, Layers3 } from "lucide-react";
import { Badge, Button, Card, EmptyState } from "../../components/ui";
export function Workspaces() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">BETTER, TOGETHER</p>
          <h1>Workspaces</h1>
          <p>Purposeful spaces for your team's knowledge.</p>
        </div>
        <Button disabled title="Workspace creation is planned">
          <Plus size={16} /> Create workspace
        </Button>
      </div>
      <div className="notice">
        <Badge>Planned capability</Badge>Workspace switching, membership,
        permissions, and tenant isolation are not active.
      </div>
      <div className="workspace-grid">
        <Card>
          <span className="welcome-icon">
            <Layers3 />
          </span>
          <h2>Development space</h2>
          <p className="muted">
            The local Phase 0 environment. Conversations are private to your
            account.
          </p>
          <div className="section-heading">
            <Badge>Local environment</Badge>
            <Users size={18} />
          </div>
        </Card>
        <Card>
          <EmptyState title="Room to grow">
            Team workspaces and membership will arrive in a future phase.
          </EmptyState>
        </Card>
      </div>
    </>
  );
}
