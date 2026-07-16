# MyPortfolio Frontend

React single-page application for a personal art portfolio website.

**Live site: [https://kaitouk.github.io/portfolio-frontend/](https://kaitouk.github.io/portfolio-frontend/)**

This is the frontend half of a frontend/backend-separated project. It is deployed on **GitHub Pages** and talks to an [ASP.NET Core Web API backend](https://github.com/kaitouK/Portfolio-backend) hosted on Azure App Service. Authentication uses Google OAuth: the backend returns a short-lived access token (kept in memory, sent as a Bearer header) plus a rotating refresh token in an HttpOnly cookie.

[中文版 README](./README.zh.md)

---

# Tech Stack

| Technology                 | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| Vite 8                     | Build tool / dev server (HTTPS via basic-ssl) |
| React 19 + TypeScript      | UI framework                                  |
| Tailwind CSS v4            | Styling (`@tailwindcss/vite` plugin)          |
| react-router-dom 7         | Client-side routing                           |
| axios                      | HTTP client with unified interceptor          |
| TipTap                     | Rich text editor (with custom image plugins)  |
| @react-oauth/google        | Google OAuth login popup                      |
| DOMPurify                  | HTML sanitization before rendering            |
| yet-another-react-lightbox | Artwork lightbox viewer                       |
| Vitest                     | Unit testing                                  |

---

# Features

## Artwork Gallery

- Cursor-based infinite scroll (IntersectionObserver triggers loading near the list bottom)
- Lightbox viewer with thumbnails and captions
- Inline edit / delete for administrators

## Journal Timeline

- TipTap rich text editor (admin only) with custom image upload plugins
- Draft auto-save with 5-second debounce; image events trigger immediate save
- Draft restore prompt on page entry
- Publish workflow
- Journal content sanitized with DOMPurify before rendering

## Image Upload

- Drag & drop with live preview
- Category selection
- Client-side file type validation (server performs full validation again)

## Authentication

- Google OAuth popup login → backend validates the ID token, returns a short-lived access token and sets a rotating refresh-token HttpOnly cookie
- Access token lives in memory only (never in localStorage), attached via `Authorization: Bearer` header by the request interceptor
- Silent refresh with a single-flight guard: on 401 the interceptor calls `/auth/refresh` once (concurrent 401s — including StrictMode's double effect — share the same request), then retries the original request
- Session restore on page reload through the HttpOnly refresh cookie
- Global auth state via React Context (`AuthContext`)
- Route guarding with `ProtectedRoute` (admin-only pages)
- 403 responses trigger a forbidden-page event; a failed refresh redirects to login

---

# Project Structure

```text
src
├── api            # axios instance, interceptors, in-memory token store, silent-refresh service
├── components     # Shared components (Header, ProtectedRoute, SocialIcons)
├── context        # AuthContext (global auth state)
├── features       # Feature modules — components/hooks/services/types live with their feature
│   ├── artworks   # Card, edit modal, artwork service, pagination hook
│   ├── categories # Category service + hook
│   └── journal    # Editor, TipTap plugins, journal service
├── pages          # Route targets only (one file per <Route>)
├── types          # Cross-feature types (ApiResponse envelope)
└── utils          # Pure helper functions (with colocated tests)
```

Placement rule: used by a single feature → lives in `features/<feature>/`; used by two or more → promoted to `components/`, `utils/`, or `types/`.

---

# Architecture

```
Component ──► custom hook ──► service ──► axios instance ──► Backend API
                                              │
                                request / response interceptors
                             (attach Bearer token; unwrap ApiResponse;
                              on 401 silently refresh once and retry;
                              403 triggers forbidden event)
```

- All API calls go through the shared axios instance in `src/api/` — no hard-coded URLs in components.
- The backend returns a unified `ApiResponse` envelope (`success` / `statusCode` / `message` / `data`); the interceptor unwraps it.
- The request interceptor attaches the in-memory access token as an `Authorization: Bearer` header.
- `withCredentials: true` is enabled so the HttpOnly refresh cookie (`__Secure-AppRefresh`, scoped to `/api/auth`) flows on auth requests.

---

# Environment Variables

Vite only exposes variables prefixed with `VITE_`. Local values live in `.env.development` / `.env.production` (both gitignored); production values are injected by GitHub Actions from repository secrets.

| Variable                | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | Absolute backend API base URL, e.g. `https://localhost:7098/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (must match the backend's configured ID)  |
| `VITE_ADMIN_ENTRY`      | Path segment for the admin entry page                            |

---

# Local Development

```bash
npm install
npm run dev
```

The dev server runs at **https://localhost:5173** (HTTPS is required for the Google OAuth popup and the cross-site secure cookie). The backend must be running at `https://localhost:7098` — see the [backend repository](https://github.com/kaitouK/Portfolio-backend) for setup.

Other scripts:

```bash
npm run build       # tsc -b && vite build (type errors block the build)
npm run lint        # eslint .
npm run preview     # preview the production build locally
```

---

# Testing

```bash
npm run test        # run once (vitest run)
npm run test:watch  # watch mode
```

Test files are colocated with source files (`*.test.ts`). Current coverage focuses on pure utility functions (URL composition, category name lookup, date formatting).

---

# Deployment (GitHub Pages)

Every push to `main` triggers GitHub Actions:

```
Push to main
      │
      ▼
npm ci → npm run build   (VITE_* injected from repo secrets)
      │
      ▼
Copy index.html → 404.html
      │
      ▼
Deploy to GitHub Pages
```

Two details worth knowing:

- **Base path**: the site is served under `/portfolio-frontend/`, configured as `base` in `vite.config.ts` and as `basename` on `BrowserRouter`. Runtime redirects use `import.meta.env.BASE_URL` so the path is defined in one place.
- **SPA fallback**: GitHub Pages has no server-side rewrite, so the build output's `index.html` is copied to `404.html` — deep links like `/timeline` load the SPA instead of a 404 page.

---

# License

This project is for personal learning and portfolio demonstration purposes.
