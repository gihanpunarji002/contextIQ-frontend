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
  const queryClient = useQueryClient();
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
    if (draft.trim() && !send.isPending)
      send.mutate({ message: draft.trim(), conversationId: id });
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
        <Badge>Mock AI · No LLM connected</Badge>
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
              <small>Deterministic mock responses</small>
            </div>
            <Badge>MOCK</Badge>
          </div>
          <div className="messages" role="log" aria-live="polite">
            {!id ? (
              <div className="chat-welcome">
                <span className="welcome-icon">
                  <Sparkles size={30} />
                </span>
                <h2>What’s on your mind?</h2>
                <p>
                  Try a conversation with the Phase 0 assistant.
                  <br />
                  Messages are saved; responses are mock demonstrations.
                </p>
                <div className="starters">
                  {[
                    "What can ContextIQ help me do?",
                    "How will knowledge search work?",
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
                    {m.role === "USER" ? "You" : "ContextIQ · MOCK"}
                  </span>
                  <p>{m.content}</p>
                  <time dateTime={m.createdAt}>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </article>
              ))
            )}
            {send.isPending && <LoadingState />}
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
                Message the mock assistant
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
                  !draft.trim() || send.isPending || (!!id && messages.isError)
                }
              >
                <Send size={18} />
              </Button>
            </form>
            <p className="composer-note">
              Mock AI does not search documents or call an LLM.{" "}
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
