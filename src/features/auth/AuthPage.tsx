import { useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Layers3, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { authApi, googleLoginUrl } from "./api";
import { Button, ErrorState, Input } from "../../components/ui";
import { errorMessage } from "../../lib/api/client";
export function AuthPage({ register = false }: { register?: boolean }) {
  const { user, accept } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const providers = useQuery({
    queryKey: ["auth-providers"],
    queryFn: authApi.providers,
    retry: 1,
  });
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const credentials = {
        email: String(data.get("email")).trim(),
        password: String(data.get("password")),
      };
      const next = register
        ? await authApi.register({
            ...credentials,
            firstName: String(data.get("firstName")).trim(),
            lastName: String(data.get("lastName")).trim(),
          })
        : await authApi.login(credentials);
      await accept(next);
      const from = (location.state as { from?: unknown } | null)?.from;
      const destination =
        typeof from === "string" &&
        /^\/(dashboard|chat|documents|workspaces|settings)([/?]|$)/.test(from)
          ? from
          : "/dashboard";
      navigate(destination, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Link className="brand" to="/login">
          <span className="brand-icon">
            <Layers3 size={25} />
          </span>
          Zipzipy AI
        </Link>
        <div>
          <p className="eyebrow">YOUR KNOWLEDGE, CONNECTED</p>
          <h1>
            Bring your ideas.
            <br />
            Find your context.
          </h1>
          <p>
            A thoughtful space for your team's knowledge, conversations, and
            what comes next.
          </p>
          <div className="auth-promise">
            <ShieldCheck size={22} />
            <span>Your conversations belong to your account.</span>
          </div>
        </div>
        <small>Zipzipy AI · Knowledge platform foundation</small>
      </aside>
      <main className="auth-main">
        <div className="auth-form-card">
          <span className="badge">WELCOME TO ZIPZIPY AI</span>
          <h1>{register ? "Create your account" : "Welcome back"}</h1>
          <p>
            {register
              ? "Start with a space of your own."
              : "Sign in to continue to your knowledge hub."}
          </p>
          {params.get("error") === "google" && (
            <ErrorState message="Google sign-in could not be completed. If you registered with a password, use that sign-in method. Otherwise try again." />
          )}
          {error && <ErrorState message={error} />}
          <form onSubmit={submit} className="auth-form">
            {register && (
              <div className="name-fields">
                <label>
                  First name
                  <Input
                    name="firstName"
                    autoComplete="given-name"
                    required
                    maxLength={80}
                    disabled={pending}
                  />
                </label>
                <label>
                  Last name
                  <Input
                    name="lastName"
                    autoComplete="family-name"
                    required
                    maxLength={80}
                    disabled={pending}
                  />
                </label>
              </div>
            )}
            <label>
              Email address
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@company.com"
                disabled={pending}
              />
            </label>
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <Input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                minLength={register ? 12 : undefined}
                maxLength={128}
                required
                disabled={pending}
                aria-describedby={register ? "password-help" : undefined}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {register && (
              <small id="password-help" className="muted">
                Use 12–128 characters. A long, unique passphrase works well.
              </small>
            )}
            <Button className="primary" type="submit" disabled={pending}>
              {pending
                ? "Please wait…"
                : register
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight size={16} />
            </Button>
          </form>
          <div className="auth-divider">
            <span>or</span>
          </div>
          <Button
            className="google-button"
            disabled={pending || !providers.data?.google}
            onClick={() => {
              window.location.assign(googleLoginUrl);
            }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.4ZM12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3v2.6A10 10 0 0 0 12 22ZM6.4 13.8a6 6 0 0 1 0-3.6V7.6H3a10 10 0 0 0 0 8.8l3.4-2.6ZM12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.6l3.4 2.6A6 6 0 0 1 12 6Z"
              />
            </svg>
            Continue with Google
          </Button>
          {providers.isError ? (
            <ErrorState
              message="Could not load sign-in options."
              retry={() => void providers.refetch()}
            />
          ) : (
            !providers.isPending &&
            !providers.data?.google && (
              <p className="auth-help">
                Google sign-in is not configured for this environment yet.
              </p>
            )
          )}
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Zipzipy AI?"}{" "}
            <Link to={register ? "/login" : "/register"} state={location.state}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-help">
            Your personal workspace for knowledge and AI conversations.
          </p>
        </div>
      </main>
    </div>
  );
}
