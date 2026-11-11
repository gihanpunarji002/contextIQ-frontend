import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowUpRight,
  Files,
  MessageSquare,
  Sparkles,
  Users,
  ArrowRight,
  BookOpen,
  Layers3,
} from "lucide-react";
import { Badge, Card, ErrorState, LoadingState } from "../../components/ui";
import { getSummary } from "./api";
import { errorMessage } from "../../lib/api/client";
export function Dashboard() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: getSummary });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR KNOWLEDGE, CONNECTED</p>
          <h1>A clearer view of everything.</h1>
          <p>One home for your team's knowledge, conversations, and ideas.</p>
        </div>
        <Badge>Phase 3 · Document RAG</Badge>
      </div>
      <section className="hero">
        <div>
          <Badge>INTRODUCING ZIPZIPY AI</Badge>
          <h2>
            Great answers start
            <br />
            with the right context.
          </h2>
          <p>
            Explore the foundation of your AI knowledge platform.
            <br />
            Start a conversation and see what's taking shape.
          </p>
          <Link className="button primary" to="/chat">
            Open AI Assistant <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-core">
            <Layers3 size={43} />
          </div>
          <span className="art-node node-one">
            <Files />
          </span>
          <span className="art-node node-two">
            <MessageSquare />
          </span>
          <span className="art-node node-three">
            <Sparkles />
          </span>
        </div>
      </section>
      <div className="section-heading">
        <h2>Workspace at a glance</h2>
        <Badge>Demo metrics · Not live usage</Badge>
      </div>
      {summary.isPending ? (
        <LoadingState />
      ) : summary.isError ? (
        <ErrorState
          message={errorMessage(summary.error)}
          retry={() => void summary.refetch()}
        />
      ) : (
        <div className="metrics">
          {(
            [
              ["Documents", summary.data.documents, Files, "Knowledge library"],
              [
                "Conversations",
                summary.data.conversations,
                MessageSquare,
                "Ideas in motion",
              ],
              ["Queries", summary.data.queries, Sparkles, "Questions explored"],
              ["Workspaces", summary.data.workspaces, Users, "Connected teams"],
            ] as const
          ).map(([label, value, Icon, hint]) => (
            <Card key={label}>
              <div className="metric-label">
                {label}
                <Icon size={19} />
              </div>
              <strong className="metric-number">
                {value.toLocaleString()}
              </strong>
              <p>
                {hint} <span className="demo-dot">· Demo</span>
              </p>
            </Card>
          ))}
        </div>
      )}
      <div className="dashboard-bottom">
        <Card>
          <div className="section-heading">
            <h2>Recent activity</h2>
            <Badge>Sample activity</Badge>
          </div>
          {[
            ["Product handbook", "Added to the demo document library", "PDF"],
            [
              "Engineering knowledge",
              "A sample conversation was started",
              "AI",
            ],
            ["Getting started guide", "Included in your demo workspace", "DOC"],
          ].map(([title, subtitle, type]) => (
            <div className="activity" key={title}>
              <span className="file-icon">{type}</span>
              <div>
                <strong>{title}</strong>
                <p>{subtitle}</p>
              </div>
              <span className="muted">Demo</span>
            </div>
          ))}
        </Card>
        <Card>
          <h2>Make yourself at home</h2>
          <p className="muted">A few places to get started.</p>
          {(
            [
              [
                "/chat",
                "Start a conversation",
                "Ask the AI assistant",
                MessageSquare,
              ],
              [
                "/documents",
                "Explore the library",
                "Preview your knowledge hub",
                BookOpen,
              ],
              [
                "/workspaces",
                "Discover workspaces",
                "See what’s on the roadmap",
                Users,
              ],
            ] as const
          ).map(([path, title, subtitle, Icon]) => (
            <Link className="quick-action" key={String(path)} to={String(path)}>
              <Icon size={20} />
              <span>
                <strong>{String(title)}</strong>
                <small>{String(subtitle)}</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}
