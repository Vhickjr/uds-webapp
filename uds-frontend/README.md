# Unilag Design Studio — Frontend

Next.js (App Router) frontend for the UNILAG Design Studio platform: the public innovation website plus the smart inventory management dashboard.

## Getting started

Requires Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint
```

## Technologies

- Next.js 15 (App Router)
- TypeScript
- React 18
- shadcn/ui + Radix UI
- Tailwind CSS
- TanStack Query

## Routes

| Route        | Contents                                                            |
| ------------ | ------------------------------------------------------------------- |
| `/`          | Public website (hero, projects, research, outreach, internships, events, sponsors, achievements, gallery, contact) |
| `/login`     | Login form; honours a `?from=` redirect target                      |
| `/signup`    | Account creation (firstName, lastName, email, phone, password, role) |
| `/dashboard` | Authenticated inventory app — wrapped in `RequireAuth`              |

The dashboard tabs are role-aware: Dashboard and Inventory for everyone, My Borrowings for `intern`, Admin for `admin`, Idea Generator for any authenticated user.

## Environment variables

Create a `.env.local` in this directory:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

If omitted, it defaults to `http://localhost:8000/api/v1`. Note that the variable must be `NEXT_PUBLIC_`-prefixed to be readable in the browser.

## Authentication

### Signup fields

firstName, lastName, email, phone, password, role (`admin` | `intern` | `guest`). All but role are required.

### Storage keys

```
uds_auth_user   # JSON serialized user payload (without password)
uds_auth_token  # JWT token string
```

### Auth flow

1. User submits signup or login.
2. Backend returns `{ success: true, data: { user, token } }`.
3. Token persisted; subsequent API calls attach `Authorization: Bearer <token>` automatically via the `api.ts` helper.
4. On app load, the token is validated with `/auth/me`; invalid tokens are cleared.

### Protected routes

Wrap protected pages with `<RequireAuth>`; unauthenticated users are redirected to `/login?from=...`.

### API helper

`src/lib/api.ts` centralizes fetch logic and error handling. `api()` attaches the bearer token; `apiNoAuth()` does not (used for `/auth/login` and `/auth/signup`).

### Logout

Calling `logout()` clears user + token from state and localStorage.

## Inventory state

`src/contexts/ComponentContext.tsx` holds components and checkout history, persisted to localStorage under `uds_components` and `uds_checkoutHistory`. Borrow/return flow: a user requests a return, and an admin approves or rejects it from the Admin tab.

## Project idea generator

`ProjectIdeaGenerator` posts the selected inventory items to `/api/llm/generate`. That endpoint is not implemented yet — until it exists, the component falls back to locally generated ideas. Saved ideas live in localStorage under `uds_savedIdeas`.

## Extending

Add refresh tokens, password reset, or finer role-based UI controls by extending `AuthContext` and the backend routes.
