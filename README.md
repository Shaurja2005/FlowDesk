# 🚀 FlowDesk — Project & Task Management Platform

> A full-stack project and task management application built from scratch with the MERN stack, inspired by Jira and GoodDay.work.

![FlowDesk Banner](https://via.placeholder.com/1200x400/6C63FF/FFFFFF?text=FlowDesk+%E2%80%94+MERN+Project+Management)

## ✨ Features

- **Role-Based Access Control** — Admin / Manager / Developer with granular permissions
- **Project Management** — Full lifecycle (Planning → Active → On Hold → Completed)
- **Kanban Board** — Drag-and-drop task cards across status columns
- **Task Management** — Create, assign, comment, log time, track subtasks
- **Real-time Notifications** — Activity-based alerts with SSE/polling
- **Activity Feed** — Complete audit trail of all user actions
- **Dashboard** — Charts (recharts), stats, my-tasks, recent activity
- **Team Management** — Admin can manage users, update roles, deactivate accounts
- **Authentication** — JWT access tokens + httpOnly refresh cookies
- **Dark Mode** — Default dark theme with light mode toggle
- **Responsive** — Mobile-first, collapsible sidebar

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6 |
| **Styling** | TailwindCSS v3 (custom design system) |
| **State** | React Context + useReducer |
| **Forms** | react-hook-form + zod |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | recharts |
| **Icons** | lucide-react |
| **Toasts** | react-hot-toast |
| **Dates** | date-fns |
| **HTTP** | Axios (with interceptors) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | bcryptjs, jsonwebtoken |
| **Email** | Nodemailer |
| **Uploads** | Multer |
| **Security** | helmet, cors, express-validator |

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB (local instance or Atlas)
- npm >= 9.x

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/flowdesk.git
cd flowdesk
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values (see Environment Variables below)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/flowdesk` |
| `JWT_ACCESS_SECRET` | JWT access token secret | — |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email address | — |
| `SMTP_PASS` | Email app password | — |
| `UPLOAD_DIR` | File upload directory | `uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5MB) |

## 📡 API Reference

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login | Public |
| `POST` | `/api/auth/logout` | Logout | Public |
| `POST` | `/api/auth/refresh` | Refresh access token | Cookie |
| `GET` | `/api/auth/me` | Get current user | 🔒 |
| `PUT` | `/api/auth/me` | Update profile/avatar | 🔒 |
| `PUT` | `/api/auth/change-password` | Change password | 🔒 |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/:id` | Get user by ID |
| `PUT` | `/api/users/:id` | Update role/status |
| `DELETE` | `/api/users/:id` | Deactivate user |

### Projects
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/projects` | List projects | All |
| `POST` | `/api/projects` | Create project | Admin, Manager |
| `GET` | `/api/projects/:id` | Get project | Member |
| `PUT` | `/api/projects/:id` | Update project | Owner, Admin |
| `DELETE` | `/api/projects/:id` | Delete project | Owner, Admin |
| `POST` | `/api/projects/:id/members` | Add member | Admin, Manager |
| `DELETE` | `/api/projects/:id/members/:uid` | Remove member | Admin, Manager |
| `GET` | `/api/projects/:id/activity` | Project activity | Member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List tasks (filtered) |
| `POST` | `/api/tasks` | Create task |
| `GET` | `/api/tasks/:id` | Get task + comments |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `POST` | `/api/tasks/:id/comments` | Add comment |
| `DELETE` | `/api/tasks/:id/comments/:cid` | Delete comment |
| `PUT` | `/api/tasks/:id/log-time` | Log work hours |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get notifications |
| `GET` | `/api/notifications/stream` | SSE stream |
| `PUT` | `/api/notifications/:id/read` | Mark read |
| `PUT` | `/api/notifications/read-all` | Mark all read |
| `DELETE` | `/api/notifications/:id` | Delete |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Aggregate stats |
| `GET` | `/api/dashboard/my-tasks` | Current user tasks |
| `GET` | `/api/dashboard/activity` | Recent activity |

## 👥 RBAC Matrix

| Feature | Admin | Manager | Developer |
|---------|:-----:|:-------:|:---------:|
| Create/Delete Projects | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ✅ | ❌ |
| Create Tasks | ✅ | ✅ | ✅ |
| Assign Tasks | ✅ | ✅ | ❌ |
| Update Task Status | ✅ | ✅ | ✅ (own) |
| Delete Tasks | ✅ | ✅ | ❌ |
| View Activity Feed | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| View All Projects | ✅ | ❌ | ❌ |

## 📁 Folder Structure

```
flowdesk/
├── backend/
│   ├── config/          # DB connection, constants
│   ├── controllers/     # Route handler logic
│   ├── middlewares/     # Auth, error handling, role guards
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── utils/           # Helpers (email, token, pagination)
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── api/         # Axios instances and API calls
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth, Theme, Notifications
│       ├── hooks/       # Custom hooks
│       ├── layouts/     # Sidebar, Navbar, MainLayout
│       ├── pages/       # Route-level page components
│       ├── routes/      # Protected/Role route guards
│       ├── utils/       # Helpers (formatDate, constants)
│       ├── App.jsx
│       └── main.jsx
│
├── README.md
└── .gitignore
```

## 🚀 Future Improvements

- [ ] Socket.io for true real-time updates
- [ ] Sprint planning view (Scrum)
- [ ] Task dependencies graph
- [ ] CSV/Excel export for reports
- [ ] Cmd+K global command palette
- [ ] Email digest (daily/weekly summaries)
- [ ] Mobile PWA support
- [ ] Jest + Supertest API tests
- [ ] Docker + docker-compose setup
- [ ] CI/CD pipeline (GitHub Actions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT © FlowDesk Contributors
