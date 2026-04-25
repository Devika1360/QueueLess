# QueueLess — Smart Virtual Queue Management System

A full-stack virtual queue management system that eliminates physical waiting lines. Customers join a digital queue, track their position in real-time, and receive notifications when their turn approaches.

## 🏗️ Architecture

```
┌─────────────────────┐       ┌──────────────────────┐       ┌─────────┐
│   React Frontend    │ REST  │  Express + TypeScript │  SQL  │  MySQL  │
│   Vite + Tailwind   │──────▶│  Backend API Server   │──────▶│  8.4    │
│   Port: 5173        │◀──────│  Port: 3001           │◀──────│  3306   │
└─────────────────────┘       └──────────────────────┘       └─────────┘
```

**Architecture Type:** Client-Server Architecture

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, JavaScript, Vite, Tailwind CSS v4 |
| **Backend** | Express.js, TypeScript, bcryptjs |
| **Database** | MySQL 8.4 |
| **State Mgmt** | React Context API |
| **Routing** | React Router v6 |

## ✨ Features

- **Customer Authentication** — Sign up / Sign in with email & password (hashed with bcrypt, stored in MySQL)
- **Admin Authentication** — Hardcoded admin credentials for staff access
- **Real-Time Queue** — Customers see live queue updates (3-second polling)
- **Event-Driven Queue** — Queue advances only when admin clicks "Next Customer" or "Skip"
- **Smart Notifications** — Toast alerts at position 5, 3, and 0 (your turn) + browser notifications
- **Role-Based Access** — Protected routes for customers and admin-only routes for staff
- **Session Persistence** — Login survives page refresh via localStorage
- **Modern UI** — Dark glassmorphism design with animations

## 📦 Project Structure

```
├── server/                     # TypeScript Backend
│   ├── src/
│   │   ├── index.ts            # Express server entry point
│   │   ├── db.ts               # MySQL connection pool
│   │   ├── routes/
│   │   │   └── queueRoutes.ts  # Auth + Queue API endpoints
│   │   └── middleware/
│   │       └── authMiddleware.ts
│   ├── .env                    # MySQL + admin credentials
│   └── package.json
│
├── src/                        # React Frontend
│   ├── App.jsx                 # Root component + routing
│   ├── context/                # Global state (Auth + Queue)
│   ├── pages/                  # LandingPage, UserDashboard, StaffDashboard
│   ├── components/             # Navbar, QueueCard, StatCard, Toast
│   ├── routes/                 # ProtectedRoute, AdminRoute
│   ├── services/               # API calls + mock data
│   └── utils/                  # ETA calculation, status helpers
│
├── package.json                # Frontend dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **MySQL 8.x** installed and running

### 1. Clone the Repository

```bash
git clone https://github.com/Devika1360/QueueLess.git
cd QueueLess
```

### 2. Set Up MySQL Database

```sql
CREATE DATABASE IF NOT EXISTS queueless;
USE queueless;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE queue_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  joined_at VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE queue_state (
  id INT PRIMARY KEY DEFAULT 1,
  current_serving_index INT DEFAULT 0
);

INSERT INTO queue_state (id, current_serving_index) VALUES (1, 0);
```

### 3. Configure Backend

```bash
cd server
npm install
```

Edit `server/.env` with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=queueless
PORT=3001
ADMIN_EMAIL=admin@queueless.com
ADMIN_PASSWORD=admin123
```

### 4. Install Frontend Dependencies

```bash
cd ..
npm install
```

### 5. Run the Application

Open **3 terminals**:

```bash
# Terminal 1 — Start MySQL (if not running as a service)
mysqld --console

# Terminal 2 — Start Backend
cd server
npm run dev
# → 🚀 QueueLess API Server running at http://localhost:3001

# Terminal 3 — Start Frontend
npm run dev
# → VITE ready at http://localhost:5173/
```

### 6. Open the App

Navigate to **http://localhost:5173**

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@queueless.com` | `admin123` |
| Customer | Sign up with any email | Your chosen password |

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Customer signup |
| POST | `/api/auth/login` | No | Login (admin or customer) |
| GET | `/api/queue` | No | Get queue + serving index |
| POST | `/api/queue/join` | No | Join the queue |
| POST | `/api/queue/next` | Admin | Serve next customer |
| POST | `/api/queue/skip` | Admin | Skip current customer |
| POST | `/api/queue/reset` | Admin | Clear queue |

## 🔔 Notification System

| Position | Alert Type | Message |
|----------|-----------|---------|
| 5th in line | 🔔 Info | "You're 5 positions away!" |
| 3rd in line | ⚡ Warning | "You're 3 positions away!" |
| Your turn | 🎉 Success | "It's your turn!" |

Notifications appear as in-app toasts and browser notifications (if permitted).

## 🔒 Security

- Passwords are **never stored in plain text** — hashed with bcrypt (10 salt rounds)
- Admin endpoints protected by Basic Auth middleware
- SQL injection prevented using parameterized queries
- CORS configured to allow only the frontend origin

## 👥 Team

Built as an academic Honors Project.

## 📄 License

This project is for educational purposes.
