# UDS Backend (Node.js + Express + MongoDB)

This is a Node.js rewrite of the original FastAPI/PostgreSQL backend. It preserves core concepts:

- Users with roles (admin, intern, guest) and active flag
- Items with quantity breakdown (available, damaged, inUse, total consistency check)
- Borrowing workflow via `UserRequest` (pending -> approved -> returned / rejected TBD)
- JWT authentication and protected routes
- Pagination helper for list endpoints
- QR code lookup for items

## Tech Stack
- Express + TypeScript
- Mongoose (MongoDB ODM)
- JSON Web Tokens (auth)
- bcryptjs (password hashing)
- CORS, Morgan (logging)

## Quick Start (Windows PowerShell)
```powershell
cd c:\Users\HP\Desktop\softwareProjects\uds-webapp\uds-backend-node
copy .env.example .env
# Edit .env as needed
npm install
npm run dev
```

Ensure MongoDB is running locally (e.g., Docker):
```powershell
docker run -d --name uds-mongo -p 27017:27017 mongo:7
```

Open: http://localhost:8000/health

## Environment Variables
```
PORT=8000
MONGO_URI=mongodb://localhost:27017/uds_db
JWT_SECRET=your_long_secret_here
JWT_EXPIRES_IN=1d
```

## API Routes
Base path: `/api/v1`

Auth:
- POST /auth/signup
- POST /auth/login
- GET  /auth/me

Inventory:
- GET    /inventory?page=&limit=
- GET    /inventory/:id
- GET    /inventory/qr/:code
- POST   /inventory  (auth required)
- PATCH  /inventory/:id (auth required)
- DELETE /inventory/:id (auth required)

Borrowing:
- POST  /borrow                (create pending request)
- POST  /borrow/:id/approve    (approve request; add admin guard later)
- POST  /borrow/:id/return     (return approved request)
- GET   /borrow/mine           (list current user's requests)

## Data Models (Simplified)
User: firstName, lastName, email, phone, password (hashed), role, isActive
Item: name, description, assignedRole, total, available, damaged, inUse, qrCode
UserRequest: user, item, status (pending|approved|rejected|returned), quantity, dueDate

## Converting From FastAPI Version
Mapping highlights:
- SQLAlchemy enums -> literal string enums in Mongoose.
- UUID primary keys -> default Mongo ObjectId.
- Postgres check constraints -> pre-save hooks / manual validation.
- Alembic migrations -> handled by schema evolution (plan migrations manually if needed).

## Next Steps
- Add role-based authorization (restrict approvals to admins).
- Add rejection flow for requests.
- Implement guest request workflow (PendingGuestRequest, ApprovedGuestRequest analogs).
- Add Swagger/OpenAPI docs (swagger-ui-express).
- Write Jest tests for controllers and auth.
- Seed script for initial items and admin user.
- Rate limiting for auth endpoints.

## Simple Seed (Optional)
Create `scripts/seed.ts` later:
```ts
import { connectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { Item } from '../src/models/Item';
// implement seeding
```

## Error Handling Pattern
Throw `new ApiError(status, message)` in controllers; global `errorHandler` sends JSON: `{ success: false, message }`.

## Pagination Envelope
`{ data: [...], page, limit, totalItems, totalPages }`

## Security Notes
- Store JWT in memory / httpOnly cookie if needed.
- Add validation layer (zod or express-validator) for incoming data.
- Sanitize inputs and enable helmet middleware.

## License
Internal use. Adapt as needed.
