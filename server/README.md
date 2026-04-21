# SCOMM Server

SCOMM Server is the backend API for commerce, payments, authentication, realtime operations, and AI-powered assistant behavior.

## Backend Scope

- Exposes domain APIs for users, products, orders, chat, notifications, and Stripe
- Handles JWT-based access control for user and admin scopes
- Coordinates payment lifecycle through Stripe checkout and webhook confirmation
- Runs an agentic AI chat loop that can call internal commerce tools
- Streams admin notifications via SSE for near real-time monitoring

## Technology Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| API Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT |
| AI Integration | Groq SDK (tool-calling model orchestration) |
| Payments | Stripe SDK + Webhooks |
| Email | Nodemailer |
| Uploads | Multer |
| Security/Traffic | Helmet, CORS, express-rate-limit |
| Logging | Morgan |

## Architecture Overview

```text
src/
├── app.js                 # middleware, route mounting, global error handlers
├── server.js              # server startup + database boot
├── secret.js              # env loading and runtime config
├── config/db.js           # MongoDB connection
├── routers/               # route definitions by domain
├── controllers/           # business logic per route
├── middleware/            # auth/admin middleware
└── models/                # Mongoose models (User, Product, Order)
```

## API Domain Map

- `/api/users` - registration, login, verification, profile management
- `/api/products` - product browsing and admin product CRUD
- `/api/orders` - order creation, user order retrieval, admin order controls
- `/api/chat` - authenticated AI shopping assistant
- `/api/stripe` - checkout session creation and webhook processing
- `/api/notifications` - admin SSE stream for operational events

## AI Agentic Chat System

### Endpoint Contract

- Endpoint: `POST /api/chat`
- Access: authenticated users only (`authenticate` middleware)
- Input: conversation history payload from client chat UI
- Output: `message`, `products`, and optional `checkoutUrl`

### Agentic Execution Model

The chat controller runs a tool-calling loop where the model can invoke internal capabilities and continue reasoning with tool outputs until a final user-facing response is produced.

Available tool intents include:

- product search
- product detail lookup
- current user order lookup
- specific order details lookup
- order creation flow

### Guardrails and Safety Rules

- Product guidance is tool-grounded to reduce hallucinated catalog results.
- Order creation is gated behind explicit confirmation intent from the user.
- Assistant output is sanitized before response delivery.
- Chat route remains protected by JWT auth to bind actions to a real user context.

### AI Provider Notes

- Active chat provider is Groq SDK with configured model orchestration.
- Environment supports Groq key rotation patterns through configured key variables.

## Request Lifecycle

1. Request enters `app.js`.
2. Middleware chain executes (logging, security, CORS, rate limiting, parsers).
3. Router dispatches to the relevant domain controller.
4. Controller interacts with models/services and returns response payload.
5. Errors flow into centralized error response middleware.

## Realtime Notifications (Admin SSE)

- Endpoint: `GET /api/notifications/stream`
- Access: authenticated admin users
- Behavior:
  - opens persistent SSE channel
  - emits heartbeat and notification events
  - supports live operational visibility for incoming order events

## Environment Variables

Define in `server/.env`:

### Core Runtime

- `SERVER_PORT`
- `MONGODB_ATLAS_URL`
- `CLIENT_URL`

### Authentication and User Flow

- `JWT_SECRET`
- `JWT_ACTIVATION_KEY`
- `DEFAULT_USER_IMAGE_PATH`

### Mail/Verification

- `SMTP_USERNAME`
- `SMTP_PASSWORD`

### AI Integration

- `GROQ_API_KEY`
- `GROQ_API_KEY_1` ... `GROQ_API_KEY_10` (optional multi-key rotation setup)
- `OPENAI_API_KEY` (optional; not primary in current chat route)

### Payments

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Local Setup

```bash
npm install
npm run dev
```

Production-style start:

```bash
npm start
```

## Operational Notes

- Stripe webhook route requires raw body and must be mounted before JSON body parsing.
- Keep `CLIENT_URL` synced with frontend origin to avoid CORS failures.
- Upload pipelines for user/product images store files under `public/images`.
- Do not commit secrets or environment values to version control.
