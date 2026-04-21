# SCOMM Client

SCOMM Client is a React + Vite frontend focused on commerce UX, role-aware navigation, and AI-assisted shopping interactions.

## Frontend Scope

- Product browsing and detailed product exploration
- Auth flows (register, login, verification, profile)
- Cart, checkout, and order history experience
- Admin pages for order and product operations
- AI chat interface connected to backend tool-calling assistant

## Technology Stack

| Layer | Technology |
| --- | --- |
| UI Framework | React 19 |
| Build Tool | Vite 6 |
| Routing | React Router |
| Data/HTTP | Axios |
| Styling | Tailwind CSS |
| Motion | Framer Motion |

## Application Architecture

```text
src/
├── App.jsx                  # route map and protected route integration
├── main.jsx                 # app bootstrap + providers
├── api.js                   # centralized API client and endpoint wrappers
├── context/                 # auth/cart context and state
├── components/              # layout, navbar, protected routes, shared UI
├── hooks/                   # custom hooks (e.g., notifications stream)
└── pages/                   # feature screens (shop, orders, admin, chat)
```

## Route Model

### Public Routes

- `/`
- `/shop`
- `/product/:id`
- `/cart`
- `/login`
- `/register`
- `/verify-email`
- `/verify-pending`
- `/chat`

### Protected User Routes

- `/profile`
- `/checkout`
- `/orders`
- `/orders/:id`

### Protected Admin Routes

- `/admin/orders`
- `/admin/products`
- `/admin/products/new`

## API Layer and Authentication Flow

- `src/api.js` defines one shared Axios instance.
- `baseURL` uses `VITE_API_URL` (default `/api`).
- Request interceptor attaches `Authorization: Bearer <token>` from local storage.
- Auth state is managed in context and reused across protected routes.
- Backend authorization checks are enforced server-side on protected endpoints.

## AI Chat Frontend Integration

The chat experience is designed as a first-class product assistant rather than a standalone chatbot.

### Primary Chat Flow

1. User opens `/chat`.
2. Chat page sends conversation history to `POST /api/chat`.
3. Backend returns:
   - assistant `message`
   - structured `products` metadata for product-card rendering
   - optional `checkoutUrl` for conversion flow handoff
4. UI updates the conversation and renders actionable product context.

### Agentic UX Outcome

Because the backend assistant uses tool-calling with live commerce data, the frontend can display grounded, actionable responses that connect directly to shopping and checkout actions.

## Development Configuration

Set values in `client/.env.development`:

- `VITE_API_URL=/api`
- `VITE_DEV_API_ORIGIN=http://localhost:<server-port>`

Vite proxy forwards:

- `/api` -> backend API origin
- `/images` -> backend static media origin

## Local Run

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Troubleshooting Checklist

- Verify `VITE_DEV_API_ORIGIN` matches the active backend port.
- Check browser storage for missing/expired `token`.
- Inspect request headers to confirm Bearer token injection.
- Confirm backend is serving `/images` for media URLs.
- Ensure admin pages are accessed with an admin-authorized account.
