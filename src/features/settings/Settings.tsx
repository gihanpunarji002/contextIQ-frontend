import { Sun, Moon, Cpu } from "lucide-react";
import { useTheme } from "../../app/providers/ThemeProvider";
import { Badge, Button, Card } from "../../components/ui";
export function Settings() {
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
            <Badge>Coming in Phase 1</Badge>
          </div>
          <div className="provider-row">
            <Cpu size={28} />
            <div>
              <strong>Gemini via a server-side provider</strong>
              <p>
                Currently using MockAiChatService. No API key is required or
                collected here.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <h2>About this environment</h2>
          <p className="muted">ContextIQ · Phase 0 foundation</p>
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
