import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../chat/api";
import { Sun, Moon, Cpu } from "lucide-react";
import { useTheme } from "../../app/providers/ThemeProvider";
import { Badge, Button, Card } from "../../components/ui";
export function Settings() {
  const provider = useQuery({
    queryKey: ["ai-status"],
    queryFn: chatApi.status,
  });
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE IT YOURS</p>
          <h1>Settings</h1>
          <p>A thoughtful setup for the way you work.</p>
        </div>
      </div>
      <div className="settings-stack">
        <Card>
          <h2>Appearance</h2>
          <p className="muted">
            Choose your preferred theme. Saved in this browser.
          </p>
          <div className="theme-options">
            {(["light", "dark"] as const).map((t) => (
              <Button
                key={t}
                className={theme === t ? "theme-choice active" : "theme-choice"}
                aria-pressed={theme === t}
                onClick={() => setTheme(t)}
              >
                {t === "light" ? <Sun /> : <Moon />}
                <strong>{t === "light" ? "Light" : "Dark"}</strong>
                <span>
                  {t === "light"
                    ? "A clean, bright workspace"
                    : "A quieter view after hours"}
                </span>
              </Button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="section-heading">
            <h2>AI provider</h2>
            <Badge>{provider.data?.mode || "Loading"}</Badge>
          </div>
          <div className="provider-row">
            <Cpu size={28} />
            <div>
              <strong>
                {!provider.data
                  ? "Provider status unavailable"
                  : provider.data.mode === "OLLAMA"
                    ? `Ollama · ${provider.data.model}`
                    : provider.data.mode === "MOCK" ? "Mock provider" : "OpenAI · Backend update required"}
              </strong>
              <p>
                {provider.data?.mode === "OLLAMA" && provider.data.configured
                  ? "Spring AI uses your local Ollama model. No OpenAI API key is needed."
                  : provider.data?.mode === "OPENAI"
                    ? "Rebuild and recreate the backend container to activate Ollama."
                    : provider.data?.mode === "MOCK"
                      ? "Demo mode is active. Set AI_MODE=OLLAMA and recreate the backend container."
                      : "Check the Ollama model and backend connection settings. No API key is required."}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <h2>About this environment</h2>
          <p className="muted">Zipzipy AI · Phase 3 · Document RAG</p>
          <p>
            Account sign-in is enabled. Team membership and tenant isolation are
            still planned. This environment is intended for local development
            only.
          </p>
        </Card>
      </div>
    </>
  );
}
