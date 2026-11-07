# ContextIQ frontend

React + TypeScript + Vite with Tailwind 4's official Vite plugin. This is a sibling of the existing `../ContextIQ` Spring Boot project.

```sh
npm ci
cp .env.example .env
npm run dev
npm run typecheck
npm run build
```

Requires Node 22.18+; opens at http://localhost:5173. `VITE_API_BASE_URL` defaults to `http://localhost:8080/api/v1`. Start PostgreSQL and the backend using [the backend README](../ContextIQ/README.md).

Chat is persisted via the API and clearly marked MOCK. Dashboard metrics, activity and documents are labeled synthetic. Theme preference persists locally. Workspaces, upload and AI provider configuration remain planned. Authentication is implemented at /login and /register with protected application routes. See [authentication setup](../ContextIQ/docs/authentication.md) to rebuild your backend and enable Google. No API keys belong in this frontend. Production static hosting needs an index.html fallback for React Router paths.
