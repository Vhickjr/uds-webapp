# uds-webapp

UNILAG Design Studio platform — public innovation website, smart inventory management, and AI project ideation.

## Packages

| Directory      | Stack                          | Dev command                        |
| -------------- | ------------------------------ | ---------------------------------- |
| `uds-frontend` | Next.js 15 (App Router), TS, Tailwind, shadcn/ui | `cd uds-frontend && npm run dev` (port 3000) |
| `uds-backend`  | Node, Express, MongoDB (Mongoose), JWT           | `cd uds-backend && npm run dev` (port 8000)  |

Point the frontend at the backend with `NEXT_PUBLIC_API_URL` in `uds-frontend/.env.local` (defaults to `http://localhost:8000/api/v1`). See each package's README for details.
