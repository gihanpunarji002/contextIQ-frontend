import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Sparkles, MessageSquare } from "lucide-react";
import { chatApi } from "./api";
import { errorMessage } from "../../lib/api/client";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/ui";
export function Chat() {
  const [params, setParams] = useSearchParams();
  const id = params.get("conversation") || undefined;
  const [draft, setDraft] = useState("");
  const [useDocuments, setUseDocuments] = useState(false);
  const queryClient = useQueryClient();
  const provider = useQuery({
    queryKey: ["ai-status"],
    queryFn: chatApi.status,
  });
  const legacyProvider = provider.data?.mode === "OPENAI";
  const mock = provider.data?.mode === "MOCK";
  const available = !!provider.data?.configured && !legacyProvider;
  const live = provider.data?.mode === "OLLAMA";
  const supportsDocuments = live && provider.data?.documentSearch === true;
  const end = useRef<HTMLDivElement>(null);
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: chatApi.conversations,
  });
  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => chatApi.messages(id!),
    enabled: !!id,
  });
  const send = useMutation({
    mutationFn: chatApi.send,
    onSuccess: async (data) => {
      setDraft("");
      setParams({ conversation: data.conversationId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
        queryClient.invalidateQueries({
          queryKey: ["messages", data.conversationId],
        }),
      ]);
    },
  });
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.data, send.isPending]);
  function submit() {
    if (
      draft.trim() &&
      !send.isPending &&
      available &&
      (!useDocuments || supportsDocuments) &&
      !(id && (messages.isError || messages.isPending))
    )
      send.mutate({ message: draft.trim(), conversationId: id, useDocuments });
  }
  function select(next?: string) {
    if (send.isPending) return;
    setParams(next ? { conversation: next } : {});
    setDraft("");
    send.reset();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A SPACE TO THINK</p>
          <h1>AI Assistant</h1>
          <p>Ask questions. Explore ideas. Build shared understanding.</p>
        </div>
        <Badge>
          {provider.isPending
            ? "Checking provider…"
            : provider.isError
              ? "Provider unavailable"
              : live
                ? `Ollama · ${provider.data?.model}`
                : mock ? "Mock AI · Demo mode" : "OpenAI · Backend update required"}
        </Badge>
      </div>
      {provider.isError && (
        <ErrorState
          message={errorMessage(provider.error)}
          retry={() => void provider.refetch()}
        />
      )}
      {legacyProvider && (
        <div className="notice" role="status">
          The backend is still running the previous OpenAI configuration. Rebuild
          and recreate the backend container to activate Ollama. Sending is disabled
          until the backend is updated. Refresh this page after updating.
        </div>
      )}
      {provider.data && !available && !legacyProvider && (
        <div className="notice" role="status">
          Ollama is not configured. Check the backend model and connection settings.
        </div>
      )}
      <div className="notice rag-mode">
        <label><input type="checkbox" checked={useDocuments} disabled={!supportsDocuments || send.isPending}
          onChange={e => setUseDocuments(e.target.checked)} /> Search my documents</label>
        {live && !supportsDocuments && <span>Update the backend to Phase 3 to enable document search.</span>}
        <span>{useDocuments ? "Answers use your indexed documents. Ask self-contained questions; source excerpts are saved with answers."
          : "General chat. Enable document search to answer from your private library."}</span>
      </div>
      <div className="chat-layout">
        <aside className="chat-history" aria-label="Conversation history">
          <Button
            className="primary"
            disabled={send.isPending}
            onClick={() => select()}
          >
            <Plus size={16} /> New conversation
          </Button>
          <p className="nav-caption">YOUR CONVERSATIONS</p>
          {conversations.isPending ? (
            <LoadingState />
          ) : conversations.isError ? (
            <ErrorState
              message={errorMessage(conversations.error)}
              retry={() => void conversations.refetch()}
            />
          ) : conversations.data.length === 0 ? (
            <EmptyState title="A fresh start">
              Your saved conversations will appear here.
            </EmptyState>
          ) : (
            conversations.data.map((c) => (
              <button
                disabled={send.isPending}
                className={`history-item ${id === c.id ? "selected" : ""}`}
                key={c.id}
                onClick={() => select(c.id)}
              >
                <MessageSquare size={16} />
                <span>
                  {c.title}
                  <small>{new Date(c.updatedAt).toLocaleDateString()}</small>
                </span>
              </button>
            ))
          )}
        </aside>
        <section className="chat-panel" aria-label="Chat">
          <div className="chat-panel-heading">
            <span className="assistant-icon">
              <Sparkles size={19} />
            </span>
            <div>
              <strong>ContextIQ Assistant</strong>
              <small>
                {live
                  ? useDocuments ? "Document chat · Retrieved sources" : "General AI chat"
                  : mock ? "Deterministic mock responses" : "Waiting for Ollama backend"}
              </small>
            </div>
            <Badge>{provider.data?.mode || "…"}</Badge>
          </div>
          <div className="messages" role="log" aria-live="polite">
            {!id ? (
              <div className="chat-welcome">
                <span className="welcome-icon">
                  <Sparkles size={30} />
                </span>
                <h2>What’s on your mind?</h2>
                <p>
                  {live
                    ? "Think through a question with your AI assistant."
                    : mock ? "Try a conversation with the demo assistant." : "Update the backend to start chatting with Ollama."}
                  <br />
                  {live
                    ? useDocuments ? "Upload TXT or Markdown in Documents, then ask a question about its contents." : "Recent messages are processed by your local Ollama model."
                    : mock ? "Messages are saved; responses are mock demonstrations." : "The running backend has not switched to Ollama yet."}
                </p>
                <div className="starters">
                  {[
                    "What can ContextIQ help me do?",
                    "Help me draft a concise project plan",
                    "Help me organize team knowledge",
                  ].map((text) => (
                    <button key={text} onClick={() => setDraft(text)}>
                      {text}
                      <ArrowIcon />
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.isPending ? (
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
                      : `ContextIQ · ${m.mode || "Unknown provider"}${m.model ? ` · ${m.model}` : ""}`}
                  </span>
                  <p>{m.content}</p>
                  {m.retrievalUsed && (
                    <div className="rag-sources">
                      <small>{m.sources?.length ? "Retrieved evidence · verify the answer against these passages" : "No matching sources · no LLM answer generated"}</small>
                      {m.sources?.map((source, index) => (
                        <details key={source.chunkId}>
                          <summary>[{index + 1}] {source.filename} · passage {source.chunkIndex + 1}</summary>
                          <p>{source.content}</p>
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
            )}
            {send.isPending && (
              <>
                <article className="message user">
                  <span className="message-author">You · Sending</span>
                  <p>{send.variables?.message}</p>
                </article>
                <div className="state" role="status">
                  <Sparkles size={18} />{" "}
                  {live ? "Generating a response…" : "Preparing demo response…"}
                </div>
              </>
            )}
            <div ref={end} />
          </div>
          <div className="composer-area">
            {send.isError && (
              <ErrorState
                message={`${errorMessage(send.error)} Check history before retrying: a timed-out request may already have saved.`}
                retry={() => submit()}
              />
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="composer"
            >
              <label className="sr-only" htmlFor="message">
                Message the assistant
              </label>
              <textarea
                id="message"
                value={draft}
                maxLength={8000}
                disabled={send.isPending}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question or share an idea…"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
              <Button
                className="primary"
                type="submit"
                aria-label="Send message"
                disabled={
                  !draft.trim() ||
                  send.isPending ||
                  !available ||
                  (useDocuments && !supportsDocuments) ||
                  (!!id && (messages.isError || messages.isPending))
                }
              >
                <Send size={18} />
              </Button>
            </form>
            <p className="composer-note">
              {live
                ? useDocuments ? "AI can make mistakes. Check the retrieved source excerpts. Your question and passages stay with local Ollama." : "General chat: no documents are searched. Messages are processed by local Ollama."
                : mock ? "Mock AI does not search documents or call an LLM." : "Ollama is not active. Update the backend before sending."}{" "}
              <span>Shift + Enter for a new line</span>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}
