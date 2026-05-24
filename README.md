# Job Assign Management System

A full-stack store task management web application built with **Laravel 11** (backend API) and **React + Vite + Tailwind CSS** (frontend).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 11 (PHP 8.2+) |
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Database | PostgreSQL |
| Auth | Laravel Sanctum (token-based) |
| HTTP Client | Axios |
| Charts | Recharts |

---

## Quick Start

### Prerequisites
- PHP 8.2+ with XAMPP or similar
- PostgreSQL (create database `job_assign_db`)
- Node.js 18+
- Composer

### 1. Backend Setup

```bash
cd backend

# Copy env and configure
cp .env.example .env
# Edit .env: set DB_PASSWORD to your PostgreSQL password

# Install dependencies
composer install

# Generate key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Create storage symlink
php artisan storage:link

# Start server
php artisan serve
```

Backend runs at: `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Test Accounts (after seeding)

| Role | Username (ID) | Password |
|------|-----------------|----------|
| Admin | 00001 | password |
| Staff 1 | 00002 | password |
| Staff 2 | 00003 | password |
| Staff 3 | 00004 | password |
| Staff 4 | 00005 | password |
| Staff 5 | 00006 | password |

---

## Features

### Admin
- Dashboard with statistics (total, completed, in-progress, overdue tasks)
- Staff performance table with progress bars
- Task distribution chart
- Create, edit, delete, and assign tasks to staff
- Filter tasks by status, priority, assigned staff
- Manage staff accounts (create, activate/deactivate)
- Performance reports with date range filter

### Staff
- Personal dashboard with task summary
- View assigned tasks with tab filters
- Start tasks (mark as in_progress)
- Complete tasks (mark as completed)
- Add comments and upload photo proof (JPG/PNG, max 5MB)

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/v1/auth/login | Public | Login |
| POST | /api/v1/auth/logout | Auth | Logout |
| GET | /api/v1/auth/me | Auth | Current user |
| GET | /api/v1/users | Admin | List staff |
| POST | /api/v1/users | Admin | Create staff |
| PUT | /api/v1/users/{id} | Admin | Update staff |
| DELETE | /api/v1/users/{id} | Admin | Deactivate staff |
| GET | /api/v1/tasks | Admin | List all tasks |
| POST | /api/v1/tasks | Admin | Create task |
| PUT | /api/v1/tasks/{id} | Admin | Update task |
| DELETE | /api/v1/tasks/{id} | Admin | Delete task |
| GET | /api/v1/dashboard | Admin | Dashboard stats |
| GET | /api/v1/reports | Admin | Performance report |
| GET | /api/v1/my-tasks | Staff | My assigned tasks |
| PUT | /api/v1/my-tasks/{id}/status | Staff | Update status |
| POST | /api/v1/my-tasks/{id}/comment | Staff | Add comment/photo |

---

## Folder Structure

```
Job_Assign_Management_System/
├── backend/          # Laravel 11 REST API
│   ├── app/
│   │   ├── Enums/         # TaskStatus, TaskPriority, UserRole
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   └── Models/        # User, Task, TaskComment
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
│
└── frontend/         # React + Vite + Tailwind CSS
    └── src/
        ├── api/           # Axios API calls
        ├── components/    # Reusable UI, layouts, tasks, dashboard
        ├── context/       # AuthContext
        ├── pages/         # Admin & Staff pages
        ├── routes/        # Route guards
        └── utils/         # Date formatting, constants
```
