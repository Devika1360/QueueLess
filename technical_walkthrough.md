# QueueLess — Complete Technical Walkthrough

## Table of Contents
1. [What Is QueueLess?](#what-is-queueless)
2. [Architecture Overview](#architecture-overview)
3. [How To Run The App](#how-to-run-the-app)
4. [Project Structure (Every File Explained)](#project-structure)
5. [How Authentication Works](#how-authentication-works)
6. [How The Queue Engine Works](#how-the-queue-engine-works)
7. [How Frontend & Backend Are Connected](#how-frontend--backend-are-connected)
8. [How Notifications Work](#how-notifications-work)
9. [How Routing & Route Protection Work](#how-routing--route-protection-work)
10. [Where Is Data Stored?](#where-is-data-stored)
11. [Data Flow Diagrams](#data-flow-diagrams)
12. [Possible Cross Questions & Answers](#possible-cross-questions--answers)

---

## What Is QueueLess?

QueueLess is a **Smart Virtual Queue Management System**. Instead of standing in a physical line, customers join a virtual queue from their device. An admin manages the queue from a dashboard, and customers get real-time notifications when their turn approaches.

**Key principle:** The queue is **event-driven**, not time-driven. The queue only advances when the admin clicks "Next Customer" or "Skip Customer" — there is no timer auto-advancing anything.

---

## Architecture Overview

```
┌─────────────────────────┐         ┌──────────────────────────┐         ┌─────────────┐
│     FRONTEND (Client)   │  HTTP   │     BACKEND (Server)     │  SQL    │   DATABASE   │
│                         │  REST   │                          │ queries │              │
│  React 19 + Vite        │────────▶│  Express + TypeScript    │────────▶│  MySQL 8.4   │
│  Tailwind CSS v4        │  API    │  Port: 3001              │         │  Port: 3306  │
│  Port: 5173             │◀────────│                          │◀────────│              │
│                         │  JSON   │  bcryptjs (password hash)│ results │  3 tables    │
└─────────────────────────┘         └──────────────────────────┘         └─────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, JavaScript, Vite, Tailwind CSS v4 | UI, user interactions, routing |
| **Backend** | Express.js, TypeScript, bcryptjs | REST API, authentication, business logic |
| **Database** | MySQL 8.4 | Persistent storage (users, queue, state) |

**Architecture Type:** Client-Server Architecture. The frontend and backend are **separate, independent services** running on different ports and communicating via HTTP REST API.

---

## How To Run The App

You need **3 terminals** running simultaneously:

```
Terminal 1 — MySQL:
  Start-Process "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" -ArgumentList "--datadir=C:\mysql_data","--console"

Terminal 2 — Backend:
  cd "d:\Honors Project\server"
  npm run dev
  → Shows: 🚀 QueueLess API Server running at http://localhost:3001

Terminal 3 — Frontend:
  cd "d:\Honors Project"
  npm run dev
  → Shows: VITE ready at http://localhost:5173/

Open browser → http://localhost:5173
```

---

## Project Structure

```
d:\Honors Project\
│
├── server/                          ◄── BACKEND (TypeScript)
│   ├── src/
│   │   ├── index.ts                 Entry point — starts Express server
│   │   ├── db.ts                    MySQL connection pool
│   │   ├── routes/
│   │   │   └── queueRoutes.ts       All API endpoints (auth + queue)
│   │   └── middleware/
│   │       └── authMiddleware.ts     Admin authorization middleware
│   ├── .env                         MySQL credentials + admin password
│   ├── package.json                 Backend dependencies
│   └── tsconfig.json                TypeScript configuration
│
├── src/                             ◄── FRONTEND (React)
│   ├── App.jsx                      Root component — routing setup
│   ├── main.jsx                     Entry point — renders App into DOM
│   │
│   ├── context/                     ◄── Global State (React Context)
│   │   ├── AuthContext.jsx          User session (login/register/logout)
│   │   └── QueueContext.jsx         Queue data (fetch/join/next/skip)
│   │
│   ├── pages/                       ◄── Full Page Components
│   │   ├── LandingPage.jsx          Login / Register form
│   │   ├── UserDashboard.jsx        Customer view + notifications
│   │   └── StaffDashboard.jsx       Admin view + queue controls
│   │
│   ├── components/                  ◄── Reusable UI Components
│   │   ├── Navbar.jsx               Top navigation bar + logout
│   │   ├── QueueCard.jsx            Single person in queue list
│   │   ├── StatCard.jsx             Stats tile (position, wait, etc.)
│   │   └── Toast.jsx                Notification popup system
│   │
│   ├── routes/                      ◄── Route Guards
│   │   ├── ProtectedRoute.jsx       Blocks unauthenticated users
│   │   └── AdminRoute.jsx           Blocks non-admin users
│   │
│   ├── services/                    ◄── API & Data Services
│   │   ├── apiService.js            All fetch() calls to backend
│   │   ├── authService.js           Auth helper (delegates to apiService)
│   │   └── mockData.js              Only AVG_SERVICE_TIME = 5 (for ETA)
│   │
│   ├── utils/
│   │   └── queueHelpers.js          Pure functions: calculateETA, getStatus
│   │
│   └── hooks/
│       └── useQueuePosition.js      Custom hook for position tracking
│
├── index.html                       HTML shell that loads React
├── package.json                     Frontend dependencies
├── vite.config.js                   Vite dev server config
└── tailwind.config.js               Tailwind CSS config
```

---

### Backend Files — What Each File Does

#### `server/src/index.ts` — Server Entry Point
- Creates an Express HTTP server on port **3001**
- Enables **CORS** so the frontend (port 5173) can make API calls
- Enables **JSON body parsing** so the server can read POST request bodies
- Mounts all API routes under the `/api` prefix
- Has a health check endpoint at `/api/health`

#### `server/src/db.ts` — MySQL Connection Pool
- Uses the `mysql2/promise` library to connect to MySQL
- Creates a **connection pool** (max 10 connections) — this is efficient because it reuses connections instead of opening a new one for every query
- Reads MySQL credentials from the `.env` file (host, user, password, database name)

#### `server/src/routes/queueRoutes.ts` — All API Endpoints
This is the largest backend file. It contains **7 endpoints**:

| Endpoint | Method | Auth? | What It Does |
|----------|--------|-------|-------------|
| `/api/auth/register` | POST | No | Creates a new customer in MySQL. Hashes password with bcrypt before storing. Returns user object. |
| `/api/auth/login` | POST | No | Checks if email matches admin (.env) → returns admin user. Otherwise queries MySQL `users` table → bcrypt.compare password → returns customer user. |
| `/api/queue` | GET | No | Returns all queue entries (ordered by join time) + the current serving index. |
| `/api/queue/join` | POST | No | Inserts a new entry into `queue_entries` table with name, email, and timestamp. |
| `/api/queue/next` | POST | **Admin** | Increments `current_serving_index` by 1 in the `queue_state` table. Protected by `requireAdmin` middleware. |
| `/api/queue/skip` | POST | **Admin** | Same as next — increments the index (skipping is functionally identical to advancing). Protected by `requireAdmin`. |
| `/api/queue/reset` | POST | **Admin** | Deletes all rows from `queue_entries` and resets `current_serving_index` to 0. |

#### `server/src/middleware/authMiddleware.ts` — Admin Guard
- Reads the `Authorization` header from incoming requests
- Expects format: `Basic <base64-encoded email:password>`
- Decodes the Base64 string, splits it into email and password
- Compares against the admin credentials from `.env`
- If match → allows the request through (`next()`)
- If no match → returns 403 Forbidden

#### `server/.env` — Environment Variables
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=queueless
PORT=3001
ADMIN_EMAIL=admin@queueless.com
ADMIN_PASSWORD=admin123
```

---

### Frontend Files — What Each File Does

#### `src/App.jsx` — Root Component
- Wraps the entire app in three layers:
  1. `<BrowserRouter>` — enables client-side routing
  2. `<AuthProvider>` — makes auth state available everywhere
  3. `<QueueProvider>` — makes queue data available everywhere
- Defines three routes:
  - `/` → `LandingPage` (public)
  - `/user` → `UserDashboard` (wrapped in `ProtectedRoute` — must be logged in)
  - `/admin` → `StaffDashboard` (wrapped in `AdminRoute` — must be admin)

#### `src/context/AuthContext.jsx` — Authentication State
- Creates a React Context that holds the current user object
- On load: checks `localStorage` for a saved session (so login survives page refresh)
- **`login(email, password)`**: Calls `POST /api/auth/login` on the backend. If admin, stores Base64 credentials for future admin API calls.
- **`register(name, email, password)`**: Calls `POST /api/auth/register`. On success, stores the user in state and localStorage.
- **`logout()`**: Clears the user from state and localStorage.
- Exposes: `{ user, login, register, logout }`

#### `src/context/QueueContext.jsx` — Queue State
- Creates a React Context that holds the queue array and current serving index
- **On mount**: Fetches queue data from `GET /api/queue`
- **Polling**: Sets up a `setInterval` that calls `GET /api/queue` **every 3 seconds** — this is how the app gets "near real-time" updates without WebSockets
- **`joinQueue(name, email)`**: Calls `POST /api/queue/join` → then immediately refetches
- **`nextCustomer()`**: Reads admin credentials from user object → calls `POST /api/queue/next` with Basic Auth header → refetches
- **`skipCustomer()`**: Same as next but calls `/skip`
- Exposes: `{ queue, currentServingIndex, joinQueue, nextCustomer, skipCustomer }`

#### `src/pages/LandingPage.jsx` — Login / Register Page
- Has a **mode toggle** at the top: "Customer" | "Staff Login"
- **Customer mode** has two sub-modes toggled by a link at the bottom:
  - **Sign In**: Email + Password → calls `login()` → redirects to `/user`
  - **Sign Up**: Full Name + Email + Password → calls `register()` → redirects to `/user`
- **Staff mode**: Email + Password → calls `login()` → if admin role → redirects to `/admin`
- Has a "Fill Admin Credentials" quick-fill button for demo purposes
- If already logged in: redirects to the appropriate dashboard via `useEffect`

#### `src/pages/UserDashboard.jsx` — Customer Dashboard
- Shows the logged-in customer's queue information
- **Auto-detects** if the user is already in the queue by matching their email against the queue data from MySQL (this is a `useMemo` that runs whenever the queue data changes)
- If **not in queue**: Shows a "Join Queue" button + queue overview
- If **in queue**: Shows position stats, people ahead, estimated wait time, status banner, and the full queue list
- **Notification logic** (explained in detail below)

#### `src/pages/StaffDashboard.jsx` — Admin Dashboard
- Shows the currently-serving person's name, email, and join time
- **Two action buttons**: "✓ Next Customer" and "⏭ Skip Customer"
- Shows stats: Total, Served, Remaining, Current Position
- Shows the full queue list with status badges (Completed, Now Serving, Almost There, Waiting)
- When "All done" → shows a celebration message

#### `src/components/Navbar.jsx` — Navigation Bar
- Sticky at the top of the page
- Shows the QueueLess logo, user's name with avatar initial, role badge, and Logout button
- Hidden on the landing page (no navbar on login screen)
- Logout clears session and redirects to `/`

#### `src/components/QueueCard.jsx` — Queue Entry Card
- Displays one person in the queue list
- Shows: position number, name, join time, and a status badge (Completed/Now Serving/Almost There/Waiting)
- The currently-serving card gets a glowing border and slight scale-up animation

#### `src/components/StatCard.jsx` — Statistics Tile
- A reusable card showing an icon, label, and big number
- Supports accent colors: indigo, cyan, emerald, amber
- Used throughout both dashboards for queue stats

#### `src/components/Toast.jsx` — Notification System
- **`useToast()` hook**: Returns `{ toasts, addToast, removeToast }`
- **`addToast(message, type, duration)`**: Creates a toast with auto-dismiss timer
- **`ToastContainer`**: Renders floating notifications in the top-right corner
- **`ToastItem`**: Individual notification with:
  - Slide-in animation (transforms from right)
  - Gradient background based on type (info=purple, warning=amber, success=green)
  - Icon, message text, close button
  - Animated progress bar that shrinks over the duration
  - Fade-out animation before removal

#### `src/services/apiService.js` — HTTP Client
- Centralizes all `fetch()` calls to the backend
- Contains 6 functions:
  - `apiRegister(name, email, password)` → POST /api/auth/register
  - `apiLogin(email, password)` → POST /api/auth/login
  - `fetchQueue()` → GET /api/queue
  - `apiJoinQueue(name, email)` → POST /api/queue/join
  - `apiNextCustomer(email, password)` → POST /api/queue/next (with Basic auth)
  - `apiSkipCustomer(email, password)` → POST /api/queue/skip (with Basic auth)

#### `src/services/mockData.js` — Fake Data (Only ETA)
- Contains **only one constant**: `AVG_SERVICE_TIME = 5`
- This is the average minutes per customer, used purely for ETA estimation
- All real data comes from MySQL — this is the only "mock" data remaining

#### `src/utils/queueHelpers.js` — Pure Helper Functions
- **`calculateETA(peopleAhead)`**: Returns `peopleAhead × 5` minutes (uses AVG_SERVICE_TIME)
- **`getStatus(customerIndex, currentServingIndex)`**: Returns one of:
  - `"Completed"` — if the customer's index is before the current serving index
  - `"Now Serving"` — if the customer is the one currently being served
  - `"Almost There"` — if the customer is next in line
  - `"Waiting"` — everyone else

#### `src/routes/ProtectedRoute.jsx` — Auth Guard
- Wraps a route and checks if `user` exists in AuthContext
- If no user → redirects to `/` (login page)
- If user exists → renders the child component

#### `src/routes/AdminRoute.jsx` — Admin Guard
- Wraps a route and checks TWO things:
  1. Is there a user? (if not → redirect to `/`)
  2. Is the user's role `'admin'`? (if not → redirect to `/user`)
- Only admin users can access the Staff Dashboard

---

## How Authentication Works

### Customer Registration Flow
```
User fills form → clicks "Create Account"
    │
    ▼
LandingPage calls register(name, email, password)
    │
    ▼
AuthContext calls apiRegister() → POST /api/auth/register
    │
    ▼
Backend receives { name, email, password }
    │
    ├── Validates: all fields present? password >= 4 chars?
    ├── Checks MySQL: SELECT id FROM users WHERE email = ?
    │   └── If email exists → 409 "Account already exists"
    │
    ├── Hashes password: bcrypt.genSalt(10) → bcrypt.hash(password, salt)
    │   └── Produces something like: $2a$10$xK8Jq...
    │       (original password is NEVER stored)
    │
    ├── Inserts into MySQL:
    │   INSERT INTO users (name, email, password_hash, role)
    │   VALUES ('John', 'john@mail.com', '$2a$10$xK8Jq...', 'customer')
    │
    └── Returns: { success: true, user: { id, name, email, role } }
         │
         ▼
    AuthContext stores user in state + localStorage
         │
         ▼
    LandingPage navigates to /user
```

### Customer Login Flow
```
User fills form → clicks "Sign In"
    │
    ▼
LandingPage calls login(email, password)
    │
    ▼
AuthContext calls apiLogin() → POST /api/auth/login
    │
    ▼
Backend receives { email, password }
    │
    ├── First check: is email === ADMIN_EMAIL from .env?
    │   └── If yes AND password matches → return admin user (skip MySQL)
    │
    ├── Second check: query MySQL
    │   SELECT id, name, email, password_hash FROM users WHERE email = ?
    │   └── If no rows → 401 "Invalid email or password"
    │
    ├── Compare password: bcrypt.compare(password, row.password_hash)
    │   └── bcrypt internally extracts the salt from the hash,
    │       re-hashes the provided password, and checks if they match
    │   └── If no match → 401 "Invalid email or password"
    │
    └── Returns: { success: true, user: { id, name, email, role } }
         │
         ▼
    AuthContext stores user in state + localStorage
    (for admin: also stores Base64-encoded credentials for API calls)
         │
         ▼
    LandingPage navigates to /user or /admin based on role
```

### Admin Login Flow
```
Same as customer login, but:
1. Email matches ADMIN_EMAIL from .env (admin@queueless.com)
2. Password matches ADMIN_PASSWORD from .env (admin123)
3. No MySQL query needed — admin is hardcoded
4. Returns { role: 'admin' }
5. Credentials stored in Base64 format for future admin API calls
```

### Session Persistence
- When user logs in → user object is saved to `localStorage`
- On page refresh → AuthContext reads `localStorage` on initialization
- This means you stay logged in even after closing and reopening the browser
- On logout → `localStorage` is cleared

---

## How The Queue Engine Works

> **Critical Concept:** The queue is driven by TWO pieces of state:
> 1. `queue[]` — an array of people, ordered by when they joined
> 2. `currentServingIndex` — an integer pointing to who is currently being served

```
queue = [Alice, Bob, Charlie, Diana, Eve]
                      ↑
          currentServingIndex = 2

Alice   → Completed (index 0 < 2)
Bob     → Completed (index 1 < 2)
Charlie → Now Serving (index 2 === 2)
Diana   → Almost There (index 3 === 2+1)
Eve     → Waiting (index 4 > 3)
```

### When admin clicks "Next Customer":
```
currentServingIndex goes from 2 → 3

Charlie → Completed
Diana   → Now Serving  ← was "Almost There", now her turn
Eve     → Almost There ← was "Waiting", now next in line
```

### When a customer joins:
```
queue = [Alice, Bob, Charlie, Diana, Eve, Frank]
                                           ↑
                                      new entry added to END

Frank's position = queue.length = 6
People ahead of Frank = 6 - 1 - currentServingIndex
ETA = peopleAhead × AVG_SERVICE_TIME
```

### Why Event-Driven (Not Time-Driven)?
- Real-world service times are unpredictable — some customers take 2 minutes, others take 20
- A timer would become inaccurate immediately
- By advancing only on admin action, the queue always reflects reality
- The AVG_SERVICE_TIME is only used for **estimating** wait — it doesn't control anything

---

## How Frontend & Backend Are Connected

### Connection Mechanism: REST API over HTTP

The frontend makes **HTTP requests** to the backend using the browser's `fetch()` API. All requests go to `http://localhost:3001/api/...`.

```
Frontend (React, port 5173)  ────HTTP────▶  Backend (Express, port 3001)
                             ◀───JSON────
```

### CORS (Cross-Origin Resource Sharing)
Since frontend (port 5173) and backend (port 3001) are on different ports, the browser blocks requests by default (security feature). The backend explicitly allows the frontend's origin:

```typescript
// server/src/index.ts
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
```

### Request/Response Cycle Example

**Customer joins queue:**
```
1. User clicks "Join Queue" on UserDashboard
2. React calls joinQueue(name, email) from QueueContext
3. QueueContext calls apiJoinQueue(name, email) from apiService
4. apiService does:
   fetch('http://localhost:3001/api/queue/join', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: 'Alice', email: 'alice@mail.com' })
   })
5. Express receives the request, routes it to queueRoutes.ts
6. Route handler:
   - Generates timestamp: "04:30 PM"
   - Executes SQL: INSERT INTO queue_entries (name, email, joined_at) VALUES (?, ?, ?)
   - MySQL stores the row
   - Returns JSON: { id: 15, name: 'Alice', email: 'alice@mail.com', joinedAt: '04:30 PM' }
7. apiService receives the JSON response
8. QueueContext calls refreshQueue() to fetch the updated list
9. React re-renders the UI with Alice now visible in the queue
```

### Polling for Real-Time Updates
Since we're not using WebSockets, the frontend polls the backend every 3 seconds:

```javascript
// QueueContext.jsx
useEffect(() => {
  refreshQueue();                              // Fetch immediately
  const interval = setInterval(refreshQueue, 3000); // Then every 3 seconds
  return () => clearInterval(interval);         // Cleanup on unmount
}, []);
```

This means when admin clicks "Next Customer", all connected user dashboards will see the update within **at most 3 seconds**.

---

## How Notifications Work

### Overview
The notification system is built with two layers:
1. **In-app toast notifications** — floating cards that slide in from the right
2. **Browser notifications** — native OS notifications (if the user grants permission)

### When Do Notifications Fire?

| Position in Queue | Notification Type | Message |
|-------------------|------------------|---------|
| **5th in line** | 🔔 Info (blue) | "You're 5 positions away! Estimated wait: ~25 minutes." |
| **3rd in line** | ⚡ Warning (amber) | "You're 3 positions away! Estimated wait: ~15 minutes." |
| **Your turn (0)** | 🎉 Success (green) | "It's your turn! Please proceed to the counter." |

### Technical Implementation

```
UserDashboard.jsx
    │
    ├── useMemo: Finds user's entry in queue by email match
    │   myEntry = queue.find(q => q.email === user.email)
    │
    ├── Derived: peopleAhead = myIndex - currentServingIndex
    │
    └── useEffect: Watches peopleAhead
        │
        ├── if peopleAhead === 5 AND not already notified:
        │   → addToast("You're 5 positions away!...", 'info', 6000)
        │   → tryBrowserNotification(...)
        │   → notifiedRef.current.add('pos-5')
        │
        ├── if peopleAhead === 3 AND not already notified:
        │   → addToast("You're 3 positions away!...", 'warning', 6000)
        │   → tryBrowserNotification(...)
        │   → notifiedRef.current.add('pos-3')
        │
        └── if peopleAhead === 0 AND status === 'Now Serving' AND not already notified:
            → addToast("It's your turn!...", 'success', 7000)
            → tryBrowserNotification(...)
            → notifiedRef.current.add('turn')
```

### Preventing Duplicate Notifications
- A `useRef(new Set())` tracks which notifications have been shown
- Before firing a notification, it checks: `notifiedRef.current.has('pos-5')`
- After firing, it adds: `notifiedRef.current.add('pos-5')`
- The Set is reset when the user joins a new queue

### Why useRef Instead of useState?
- `useState` would cause a re-render every time we mark a notification as "sent"
- `useRef` persists the value between renders **without triggering re-renders**
- This is a performance optimization — notification tracking is a side effect, not UI state

### How The Trigger Chain Works
```
Admin clicks "Next Customer"
    → Backend: UPDATE queue_state SET current_serving_index + 1
    → Within 3 seconds: frontend polls GET /api/queue
    → QueueContext updates currentServingIndex
    → React re-renders UserDashboard
    → useMemo recalculates peopleAhead
    → useEffect detects new peopleAhead value
    → If peopleAhead matches 5, 3, or 0 → notification fires
```

---

## How Routing & Route Protection Work

### React Router Setup (App.jsx)
```jsx
<Routes>
  <Route path="/"     element={<LandingPage />} />
  <Route path="/user"  element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
  <Route path="/admin" element={<AdminRoute><StaffDashboard /></AdminRoute>} />
</Routes>
```

### Route Guards

**ProtectedRoute** — checks if user is logged in:
```
Is user logged in? (user !== null)
  ├── YES → render the child component
  └── NO  → redirect to / (login page)
```

**AdminRoute** — checks login AND role:
```
Is user logged in?
  ├── NO  → redirect to / (login page)
  └── YES → Is user.role === 'admin'?
            ├── YES → render StaffDashboard
            └── NO  → redirect to /user (customer dashboard)
```

This means:
- A non-logged-in user **cannot** access `/user` or `/admin`
- A customer **cannot** access `/admin` (gets redirected to `/user`)
- Only an admin can access `/admin`

---

## Where Is Data Stored?

### MySQL Database: `queueless`

**Table 1: `users`** — Customer accounts
```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,          -- "John Doe"
  email         VARCHAR(255) UNIQUE NOT NULL,   -- "john@mail.com"
  password_hash VARCHAR(255) NOT NULL,          -- "$2a$10$xK8Jq..." (bcrypt)
  role          VARCHAR(50) DEFAULT 'customer', -- always 'customer'
  created_at    TIMESTAMP DEFAULT NOW()
);
```

**Table 2: `queue_entries`** — People currently in the queue
```sql
CREATE TABLE queue_entries (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,   -- "John Doe"
  email      VARCHAR(255) NOT NULL,   -- "john@mail.com"
  joined_at  VARCHAR(50) NOT NULL,    -- "04:30 PM"
  created_at TIMESTAMP DEFAULT NOW()  -- used for ordering
);
```

**Table 3: `queue_state`** — Which position is currently being served
```sql
CREATE TABLE queue_state (
  id                    INT PRIMARY KEY DEFAULT 1,
  current_serving_index INT DEFAULT 0   -- pointer into queue_entries
);
-- This table always has exactly ONE row (id=1)
```

### localStorage (Browser)
- Stores the user session object so login survives page refresh
- Key: `queueless_user`
- Value: `{ id, name, email, role }` (JSON stringified)

### Where Admin Credentials Are Stored
- In `server/.env` file (not in MySQL)
- `ADMIN_EMAIL=admin@queueless.com`
- `ADMIN_PASSWORD=admin123`
- There is exactly ONE admin — hardcoded

---

## Data Flow Diagrams

### Complete Customer Journey
```
┌─────────────┐     ┌────────────┐     ┌──────────┐     ┌─────────┐
│  Landing    │     │  Register/ │     │  User    │     │  Gets   │
│  Page       │────▶│  Login     │────▶│ Dashboard│────▶│ Notified│
│  (form)     │     │ (backend)  │     │ (queue)  │     │ (toast) │
└─────────────┘     └────────────┘     └──────────┘     └─────────┘
      │                   │                  │                │
      │          POST /api/auth/     POST /api/queue/   useEffect
      │          register or         join              watches
      │          login                                 peopleAhead
      │                   │                  │                │
      │              ┌────▼────┐       ┌─────▼──────┐        │
      │              │  MySQL  │       │   MySQL    │        │
      │              │  users  │       │   queue_   │        │
      │              │  table  │       │   entries  │        │
      │              └─────────┘       └────────────┘        │
```

### Admin Controls Queue
```
Admin clicks "Next Customer"
    │
    ▼
StaffDashboard → nextCustomer() → QueueContext
    │
    ▼
apiNextCustomer(email, password)
    │
    ▼
POST /api/queue/next
Headers: { Authorization: "Basic YWRtaW5AcXVldWVsZXNzLmNvbTphZG1pbjEyMw==" }
    │
    ▼
authMiddleware.ts:
    - Decodes Base64 → "admin@queueless.com:admin123"
    - Matches .env → ALLOWED ✓
    │
    ▼
queueRoutes.ts: UPDATE queue_state SET current_serving_index = index + 1
    │
    ▼
All connected clients poll GET /api/queue within 3 seconds
    │
    ▼
UserDashboards re-render → notifications may fire
```

---

## Possible Cross Questions & Answers

### Architecture & Design

**Q: Why use React Context instead of Redux?**
A: Context API is built into React — no extra library needed. Our app has only two pieces of global state (user + queue), which Context handles perfectly. Redux would be overkill for this scale.

**Q: Why polling instead of WebSockets?**
A: Polling (fetch every 3 seconds) is simpler to implement and debug. WebSockets add complexity with connection management, reconnection logic, and additional server setup. For an academic project with moderate traffic, 3-second polling provides sufficient responsiveness.

**Q: Why is the queue event-driven and not time-driven?**
A: Real service times vary wildly — one customer might take 1 minute, another 30. A timer would immediately become inaccurate. By advancing only when the admin clicks "Next", the system always reflects reality.

**Q: What is Client-Server Architecture?**
A: The client (React frontend) and server (Express backend) are separate applications. The client handles the UI and user interactions. The server handles data processing and database access. They communicate via a standardized REST API. Neither can function alone — the client needs the server for data, and the server needs the client to present it to users.

### Authentication & Security

**Q: How are passwords stored securely?**
A: Passwords are **never stored in plain text**. When a user registers, the server uses `bcrypt.genSalt(10)` to generate a random salt, then `bcrypt.hash(password, salt)` to create a one-way hash. Only the hash is stored in MySQL. During login, `bcrypt.compare()` re-hashes the input and compares — the original password is never retrievable.

**Q: What is bcrypt and why use it?**
A: bcrypt is a password hashing algorithm specifically designed for security. It's slow on purpose (unlike MD5/SHA) — this makes brute-force attacks impractical. The `10` in `genSalt(10)` means 2^10 = 1024 rounds of hashing, taking about 100ms per password.

**Q: What is the Authorization header and Basic auth?**
A: For admin-only endpoints, the frontend sends the admin's email and password encoded in Base64 in the HTTP header: `Authorization: Basic YWRtaW5AcXVldWVsZXNzLmNvbTphZG1pbjEyMw==`. The backend decodes this and verifies the credentials. This is HTTP Basic Authentication — simple but effective for server-to-server communication.

**Q: Why is admin hardcoded and not in the database?**
A: For this project, there is exactly one admin. Storing one set of credentials in `.env` is simpler and more secure than building a full admin management system. In production, admins would be registered in the database with a role column.

**Q: How does session persistence work?**
A: When a user logs in, their user object is saved to `localStorage` (browser storage that persists across tabs and refreshes). On app load, `AuthContext` reads from localStorage. On logout, localStorage is cleared.

### Database

**Q: What is a connection pool?**
A: Instead of opening a new MySQL connection for every API request (slow), a pool keeps 10 connections open and reuses them. When a request needs the database, it borrows a connection from the pool, runs the query, and returns it. This dramatically improves performance.

**Q: Why is queue_state a separate table?**
A: The `current_serving_index` is a single integer shared across all clients. Storing it in its own table (with exactly one row) makes it easy to read and update atomically without affecting the queue entries.

**Q: What does AUTO_INCREMENT mean?**
A: MySQL automatically assigns an incrementing integer to new rows. The first customer gets id=1, the next id=2, etc. We never need to manually specify IDs.

**Q: What does UNIQUE on the email column do?**
A: It prevents duplicate accounts. If someone tries to register with an email that already exists, MySQL rejects the INSERT and the backend returns "Account already exists".

### Frontend

**Q: What is React Context API?**
A: Context is React's built-in way to share state across components without passing props through every level (called "prop drilling"). `AuthContext` and `QueueContext` are created at the top of the component tree, and any nested component can access them via `useAuth()` or `useQueue()`.

**Q: What is derived state?**
A: Instead of storing calculated values (like ETA, status, people ahead) in state, we compute them from the source data on every render. For example: `const eta = calculateETA(peopleAhead)`. This prevents bugs where stored values get out of sync with the actual queue data.

**Q: Why useMemo for finding the user's queue entry?**
A: `useMemo` caches the result of `queue.find()` and only recalculates when `queue` or `user.email` changes. Without it, the find operation would run on every single render, even if the data hasn't changed.

**Q: Why useRef for notification tracking instead of useState?**
A: Updating state triggers a re-render. Since notification tracking is invisible to the UI (it's just a Set of strings), using `useRef` avoids unnecessary re-renders. The ref persists across renders but updating it doesn't cause the component to re-render.

### Notifications

**Q: How does the browser Notification API work?**
A: First, we check if the browser supports it (`'Notification' in window`). Then we check/request permission. If granted, `new Notification(title, { body })` creates an OS-level notification even if the browser tab is in the background. If denied, only the in-app toast appears.

**Q: What prevents the same notification from firing multiple times?**
A: A `useRef` holding a `Set` tracks which notifications have been shown (e.g., `'pos-5'`, `'pos-3'`, `'turn'`). Before firing, we check `notifiedRef.current.has('pos-5')`. After firing, we add it. The Set resets when the user joins a new queue.

**Q: What triggers the notification to fire?**
A: The `useEffect` in UserDashboard watches `peopleAhead`. When the admin clicks "Next Customer" → MySQL updates → frontend polls and gets new data → `currentServingIndex` changes → `peopleAhead` is recalculated → useEffect fires → if `peopleAhead` matches 5, 3, or 0 → toast appears.
