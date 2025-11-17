Unilag Design Studio - Inventory System

Professional electrical engineering studio inventory management system for tracking components and equipment

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Authentication Integration

The frontend now integrates with the backend JWT authentication system.

### Environment Variables

Create a `.env` file in `uds-frontend` root:

```
VITE_API_URL=http://localhost:8000/api/v1
```

If omitted, it defaults to `http://localhost:8000/api/v1`.

### Signup Fields

The signup form expects: firstName, lastName, email, phone, password, role (admin | intern | guest). All but role are required.

### Storage Keys

```
uds_auth_user   # JSON serialized user payload (without password)
uds_auth_token  # JWT token string
```

### Auth Flow

1. User submits signup or login.
2. Backend returns `{ success: true, data: { user, token } }`.
3. Token persisted; subsequent API calls attach `Authorization: Bearer <token>` automatically via `api.ts` helper.
4. On app load, token is validated with `/auth/me`; invalid tokens are cleared.

### Protected Routes

Wrap protected pages with `<RequireAuth>`; unauthenticated users are redirected to `/login`.

### API Helper

`src/lib/api.ts` centralizes fetch logic and error handling.

### Logout

Calling `logout()` clears user + token from state and localStorage.

### Extending

Add refresh tokens, password reset, or role-based UI controls by extending `AuthContext` and backend routes.
