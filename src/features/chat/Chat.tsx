import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowUp, ArrowUpRight, Sparkles, MessageSquare, Search, FileText, PenLine, ListChecks, Lightbulb, BookOpen, Compass, Pause, Play, Library, ShieldCheck } from "lucide-react";
import { chatApi, type DocumentContext } from "./api";
import { errorMessage } from "../../lib/api/client";
import { useAuth } from "../../app/providers/AuthProvider";
import { Button, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { documentApi } from "../documents/api";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { folderApi } from "../documents/folders";
import { KnowledgeScope } from "./KnowledgeScope";
import { AiOrb } from "./AiOrb";
import "./chat.css";

const starters = [
  { title: "Write something", description: "Find the right words.", icon: PenLine, prompt: "Help me draft a clear, concise project update for my team." },
  { title: "Explore an idea", description: "Make room for your next idea.", icon: Lightbulb, prompt: "Help me brainstorm practical ideas for improving how our team shares knowledge." },
  { title: "Make a plan", description: "Turn a goal into next steps.", icon: ListChecks, prompt: "Help me break a project into a practical plan. Ask me about the goal first." },
  { title: "Find an answer", description: "Look inside your documents.", icon: Search, prompt: "What are the key decisions described in my documents?", documents: true },
  { title: "Summarize a document", description: "Get to what matters most.", icon: BookOpen, prompt: "Summarize the main points in my documents and cite the supporting passages.", documents: true },
  { title: "Explain a concept", description: "Make the complex feel simple.", icon: Compass, prompt: "Help me understand a new concept. Ask me what I would like to learn about." },
];

export function Chat() {
  const { workspace } = useWorkspace();
  const [params] = useSearchParams();
  return <ChatWorkspace key={`${workspace.id}:${params.get("conversation") || "new"}`} />;
}

function ChatWorkspace() {
  const { workspace } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const id = params.get("conversation") || undefined;
  const [draft, setDraft] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [motionPaused, setMotionPaused] = useState(false);
  const { user } = useAuth();
  const input = useRef<HTMLTextAreaElement>(null);
  const [newContext, setNewContext] = useState<DocumentContext>({ useDocuments: false, documents: [], folders: [] });
  const queryClient = useQueryClient();
  const provider = useQuery({
    queryKey: ["ai-status"],
    queryFn: chatApi.status,
  });
  const legacyProvider = provider.data?.mode === "OPENAI";
  const mock = provider.data?.mode === "MOCK";
  const available = !!provider.data?.configured && !legacyProvider;
  const live = provider.data?.mode === "OLLAMA";
  const supportsSelection = provider.data?.documentSelection === true;
  const supportsFolders = provider.data?.folderSelection === true;
  const folderList = useQuery({ queryKey: ["folders", workspace.id], queryFn: () => folderApi.list(workspace.id), enabled: supportsFolders });
  const supportsDocuments = live && provider.data?.documentSearch === true;
  const savedContext = useQuery({ queryKey: ["conversation-documents", workspace.id, id], queryFn: () => chatApi.context(id!, workspace.id), enabled: !!id && supportsSelection });
  const library = useQuery({ queryKey: ["documents", workspace.id], queryFn: () => documentApi.list(workspace.id), enabled: supportsSelection });
  const context = id ? savedContext.data ?? { useDocuments: false, documents: [], folders: [] } : newContext;
  const selectedFolders = (context.folders ?? []).map(f => {
    const current = folderList.data?.find(item => item.id === f.id);
    return { ...f, name: current?.name ?? f.name, available: f.available && (!folderList.data || !!current), documentCount: current?.documentCount ?? f.documentCount };
  });
  const normalizedContext = { ...context, folders: selectedFolders };
  const useDocuments = context.useDocuments;
  const selectedDocuments = context.documents.map(d => ({ ...d, available: d.available && (!library.data || library.data.some(item => item.id === d.id)) }));
  const hasSources = selectedDocuments.some(d => d.available) || selectedFolders.some(f => f.available && f.documentCount > 0);
  const saveSelection = useMutation({
    mutationFn: chatApi.selectDocuments,
    onSuccess: (data) => {
      queryClient.setQueryData(["conversation-documents", workspace.id, id], data);
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const contextBusy = (selectedFolders.length > 0 && !supportsFolders) || saveSelection.isPending || !supportsSelection || (!!id && (savedContext.isPending || savedContext.isError));
  function updateContext(next: DocumentContext) {
    if (send.isPending || contextBusy) return;
    next = { ...next, folders: next.folders ?? [] };
    if (id) saveSelection.mutate({ id, context: next, workspaceId: workspace.id });
    else setNewContext(next);
  }
  const end = useRef<HTMLDivElement>(null);
  const conversations = useQuery({
    queryKey: ["conversations", workspace.id],
    queryFn: () => chatApi.conversations(workspace.id),
  });
  const messages = useQuery({
    queryKey: ["messages", workspace.id, id],
    queryFn: () => chatApi.messages(id!, workspace.id),
    enabled: !!id,
  });
  const send = useMutation({
    mutationFn: chatApi.send,
    onSuccess: async (data) => {
      setDraft("");
      setParams({ conversation: data.conversationId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["conversation-documents", workspace.id, data.conversationId] }),
        queryClient.invalidateQueries({
          queryKey: ["messages", workspace.id, data.conversationId],
        }),
      ]);
    },
  });
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
  }, [messages.data, send.isPending]);
  function submit() {
    if (
      draft.trim() &&
      !send.isPending && !contextBusy &&
      (!useDocuments || hasSources) &&
      available &&
      (!useDocuments || supportsDocuments) &&
      !(id && (messages.isError || messages.isPending))
    )
      send.mutate({ workspaceId: workspace.id, message: draft.trim(), conversationId: id, useDocuments, documentIds: context.documents.map(d => d.id), folderIds: selectedFolders.map(f => f.id) });
  }
  function select(next?: string) {
    if (send.isPending || saveSelection.isPending) return;
    setParams(next ? { conversation: next } : {});
    if (!next) setNewContext({ useDocuments: false, documents: [], folders: [] });
    setDraft("");
    send.reset();
  }

  const history = (conversations.data || []).filter(c => c.title.toLowerCase().includes(historySearch.toLowerCase()));
  function choosePrompt(prompt: string, documents = false) {
    if (send.isPending || contextBusy) return;
    updateContext({ ...context, useDocuments: documents });
    setDraft(prompt);
    input.current?.focus();
  }
  const providerLabel = provider.isPending ? "Connecting…" : provider.isError ? "Provider unavailable"
    : live ? `Ollama · ${provider.data?.model}` : mock ? "Mock AI · Demo" : "Backend update required";
  return (
    <div className="assistant-studio">
      <div className="studio-heading">
        <div><span className="studio-eyebrow">A LITTLE CLARITY STARTS HERE</span><h1>Ask with AI Assistant</h1></div>
        <div className="studio-heading-actions">
          <span className={`studio-provider ${available ? "is-ready" : ""}`}><i />{providerLabel}</span>
          <button className="icon-button" aria-label={motionPaused ? "Play AI orb animation" : "Pause AI orb animation"}
            aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? <Play size={16} /> : <Pause size={16} />}</button>
        </div>
      </div>
      {provider.isError && <ErrorState message={errorMessage(provider.error)} retry={() => void provider.refetch()} />}
      {provider.data && !supportsSelection && <div className="notice" role="status">Rebuild the backend to enable saved document selection. Sending is disabled until this update is applied.</div>}
      {legacyProvider && <div className="notice" role="status">Rebuild the backend to activate Ollama. Sending is disabled until the backend is updated.</div>}
      {provider.data && !available && !legacyProvider && <div className="notice" role="status">Ollama is not configured. Check the backend model and connection settings.</div>}
      <div className="studio-grid">
        <section className={`studio-canvas ${id || send.isPending ? "has-conversation" : ""}`} aria-label="AI Assistant chat">
          <div className="studio-canvas-top"><span><Sparkles size={14} />{useDocuments ? "Connected to your knowledge" : "Your space to think"}</span>
            <button className="studio-new" disabled={send.isPending} onClick={() => select()}><Plus size={15} /> New chat</button>
          </div>
          {!id && !send.isPending ? (
            <div className="studio-welcome">
              <AiOrb paused={motionPaused} />
              <span className="studio-welcome-label">IDEAS START WITH A CONVERSATION</span>
              <h2>Welcome{user?.firstName ? `, ${user.firstName}` : " back"}<span>.</span></h2>
              <p>A fresh perspective. A clearer answer. A place to begin.<br />What would you like to explore today?</p>
              <div className="studio-starters">
                {starters.map(({ title, description, icon: Icon, prompt, documents }) => (
                  <button key={title} className="studio-prompt" disabled={!!documents && !supportsDocuments}
                    title={documents && !supportsDocuments ? "Document search requires the Phase 3 Ollama backend" : undefined}
                    onClick={() => choosePrompt(prompt, documents)}>
                    <span className="studio-prompt-icons"><Icon size={19} strokeWidth={1.5} /><ArrowUpRight size={15} /></span>
                    <strong>{title}</strong><small>{description}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages studio-messages" role="log" aria-live="polite" aria-label="Conversation messages">
              {id && (messages.isPending ? (
              <LoadingState />
            ) : messages.isError ? (
              <ErrorState
                message={errorMessage(messages.error)}
                retry={() => void messages.refetch()}
              />
            ) : messages.data.length === 0 ? (
              <EmptyState title="No messages yet">
                Send a message to begin.
              </EmptyState>
            ) : (
              messages.data.map((m) => (
                <article
                  key={m.id}
                  className={`message ${m.role === "USER" ? "user" : "assistant"}`}
                >
                  <span className="message-author">
                    {m.role === "USER"
                      ? "You"
                      : `Zipzipy AI · ${m.mode || "Unknown provider"}${m.model ? ` · ${m.model}` : ""}`}
                  </span>
                  <p>{m.content}</p>
                  {m.retrievalUsed && (
                    <div className="rag-sources">
                      <small>{m.sources?.length ? "Retrieved evidence · verify the answer against these passages" : "No matching sources · no LLM answer generated"}</small>
                      {m.sources?.map((source, index) => (
                        <details key={source.chunkId}>
                          <summary>[{index + 1}] {source.filename} · passage {source.chunkIndex + 1}</summary>
                          <p>{source.content}</p>
                          <small>Saved excerpt from when this answer was generated.{library.data && !library.data.some(d => d.id === source.documentId) ? " Original document is unavailable (deleted)." : ""}</small>
                          <small>Similarity: {source.score.toFixed(3)} · retrieval score, not answer confidence</small>
                        </details>
                      ))}
                    </div>
                  )}
                  {m.outputTokens !== null && (
                    <small className="muted">
                      {m.inputTokens?.toLocaleString()} input ·{" "}
                      {m.outputTokens.toLocaleString()} output tokens
                    </small>
                  )}
                  <time dateTime={m.createdAt}>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </article>
              ))
            ))}
              {send.isPending && <>
                <article className="message user"><span className="message-author">You · Sending</span><p>{send.variables?.message}</p></article>
                <div className="studio-thinking" role="status"><AiOrb paused={motionPaused} small /><span>{mock ? "Preparing demo response" : useDocuments ? "Finding context and thinking" : "Thinking it through"}<span className="thinking-dots">…</span></span></div>
              </>}
              <div ref={end} />
            </div>
          )}
          <div className="studio-compose-area">
            {id && supportsSelection && savedContext.isPending && <LoadingState />}
            {savedContext.isError && <ErrorState message={errorMessage(savedContext.error)} retry={() => void savedContext.refetch()} />}
            {saveSelection.isError && <ErrorState message={errorMessage(saveSelection.error)} retry={() => saveSelection.variables && saveSelection.mutate(saveSelection.variables)} />}
            {(useDocuments || selectedDocuments.length > 0 || selectedFolders.length > 0) && <KnowledgeScope
              context={normalizedContext} onChange={updateContext} disabled={send.isPending || contextBusy}
              foldersSupported={supportsFolders} saving={saveSelection.isPending} persisted={!!id} />}
            {send.isError && <ErrorState message={`${errorMessage(send.error)} Check history before retrying: a timed-out request may already have saved.`} retry={() => submit()} />}
            <form className="studio-composer" onSubmit={e => { e.preventDefault(); submit(); }}>
              <label className="sr-only" htmlFor="message">Message the assistant</label>
              <textarea id="message" ref={input} value={draft} maxLength={8000} rows={2} disabled={send.isPending}
                onChange={e => setDraft(e.target.value)} placeholder={useDocuments ? "Ask a question about your documents…" : "Ask anything. Or start with a little inspiration…"}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} />
              <div className="studio-compose-toolbar">
                <div className="studio-compose-tools">
                  <Link className="studio-library" to={`/workspaces/${workspace.id}/knowledge`} aria-label="Upload or manage documents" title="Upload or manage documents"><Plus size={18} /></Link>
                  <label className={`studio-document-toggle ${useDocuments ? "active" : ""}`} title={!supportsDocuments ? "Update the backend to Phase 3 to enable document search" : "Ground answers in your indexed documents"}>
                    <input type="checkbox" checked={useDocuments} disabled={(!supportsDocuments && !useDocuments) || send.isPending || contextBusy} onChange={e => updateContext({ ...context, useDocuments: e.target.checked })} />
                    <FileText size={14} /><span>Search knowledge</span>
                  </label>
                </div>
                <Button className="studio-send" type="submit" aria-label="Send message" disabled={!draft.trim() || send.isPending || contextBusy || (useDocuments && !hasSources) || !available || (useDocuments && !supportsDocuments) || (!!id && (messages.isError || messages.isPending))}><ArrowUp size={19} /></Button>
              </div>
            </form>
            <div className="studio-compose-note"><span>{mock ? "Demo mode · No LLM is called" : useDocuments ? "Document answers · Verify the source excerpts" : "General chat · No documents searched"}</span><span>Shift + Enter for a new line</span></div>
          </div>
        </section>
        <aside className="studio-history" aria-label="Conversation history">
          <div className="studio-history-heading"><h2>Recent conversations</h2><span>{conversations.data?.length ?? "—"}</span></div>
          <p className="studio-history-subtitle">Pick up where you left off.</p>
          <div className="studio-history-list">
            {conversations.isPending ? <LoadingState /> : conversations.isError ? <ErrorState message={errorMessage(conversations.error)} retry={() => void conversations.refetch()} />
              : history.length ? history.map(c => <button key={c.id} className={`studio-history-item ${id === c.id ? "selected" : ""}`} aria-current={id === c.id ? "true" : undefined} disabled={send.isPending} onClick={() => select(c.id)}>
                <span className="studio-history-icon"><MessageSquare size={16} strokeWidth={1.5} /></span>
                <span><strong>{c.title}</strong><time dateTime={c.updatedAt}>{new Date(c.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></span>
                <ArrowUpRight size={13} />
              </button>) : <div className="studio-history-empty"><MessageSquare size={25} strokeWidth={1} /><strong>{historySearch ? "No matching conversations" : "Your next idea starts here"}</strong><p>{historySearch ? "Try another search." : "Start a chat and it will be saved here for you."}</p></div>}
          </div>
          <Link to={`/workspaces/${workspace.id}/knowledge`} className="studio-knowledge"><Library size={20} strokeWidth={1.5} /><strong>Bring your own context</strong><p>Add documents for answers grounded in your knowledge.</p><span>Open document library <ArrowUpRight size={13} /></span></Link>
          <label className="studio-history-search"><Search size={16} /><input aria-label="Search conversations" placeholder="Search conversations" value={historySearch} onChange={e => setHistorySearch(e.target.value)} /></label>
          <div className="studio-private"><ShieldCheck size={13} /> Private conversations · {workspace.name}</div>
        </aside>
      </div>
    </div>
  );
}
