# AI Battle Arena — Full Documentation

## Overview

AI Battle Arena is a comprehensive platform for hosting AI agent competitions. It facilitates the entire lifecycle of a hackathon or coding battle, including participant registration, team formation, problem statement distribution, API-based submission testing, automated scoring, and real-time leaderboards.

The system consists of a modern **React (Vite)** frontend and an **Express + MongoDB** backend.

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript (Vite)
- **UI Library**: Shadcn UI + Radix Primitives
- **Styling**: Tailwind CSS + Tailwind Merge + CVA
- **State/Data**: React Query, React Router DOM
- **Animation**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Native Driver)
- **Authentication**: JWT + Bcrypt
- **Process Management**: Nodemon (Dev)

## Directory Structure

```
ai-arena-masters/
├── src/                    # Frontend Source Code
│   ├── components/         # Reusable UI Components
│   ├── pages/              # Main Page Views (Index, Dashboard, Admin, etc.)
│   ├── integrations/       # API Clients (MongoDB wrapper)
│   ├── lib/                # Utilities (Auth, utils, mock data)
│   └── hooks/              # Custom React Hooks
├── server/                 # Backend Source Code
│   ├── index.js            # Main Express Server Entry Point
│   ├── import_teams_csv.js # Data Import Script
│   └── seed.js             # Database Seeding Script
├── public/                 # Static Assets
└── dist/                   # Production Build Output
```

## Features

### 1. Public Interface
- **Home Page**: Hero section, "How it Works", Active Competitions, and CTA for registration.
- **Scoreboard**: Publicly accessible real-time leaderboard showing team rankings and scores.

### 2. Participant Dashboard
- **Team Management**: View team members and details.
- **Authentication**: Secure login for Team Leads (participants).
- **API Submission**: Submit API endpoints for evaluation.
- **Real-time Feedback**: Instant validation and scoring of submitted APIs.
- **Score History**: Visual graph of performance over time.

### 3. Admin Dashboard
- **Analytics**: Overview of total teams, active submissions, and event status.
- **Event Management**: Create and manage events, rounds, and rules.
- **Team Management**: Shortlist/Reject teams, view detailed member data.
- **Round Advancement**: Control the flow of the competition (Round 1 -> Round 2, etc.).
- **Evaluation Panel**: Tools to manually trigger or review evaluations.

## Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or Atlas connection string)

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start Development Server
npm run dev
```
The frontend will run on `http://localhost:8080` (or similar).

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Start Server
npm start
```
The backend will run on `http://localhost:4000`.

### 3. Data Loading (Optional)
To import initial users and teams from a CSV/JSON source:
```bash
# From root directory
npm run import
```

## Environment Variables

### Frontend (`.env` or Environment)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL for the backend API | `http://localhost:4000` |

### Backend (`server/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Connection String | `mongodb://localhost:27017` |
| `DB_NAME` | Database Name | `ai_arena` |
| `PORT` | Server Port | `4000` |
| `JWT_SECRET` | Secret key for token signing | `dev-secret` |

## Deployment Guide

### Option 1: VPS / Virtual Machine (Full Control)
Recommended for events needing low latency or specific hardware.
1.  **Backend**: Transfer `server/` directory. Run with `pm2 start index.js`.
2.  **Frontend**: Run `npm run build`. Serve `dist/` folder using Nginx/Apache.
3.  **Config**: Set `VITE_API_URL` to the public IP/Domain of the backend before building.

### Option 2: Cloud PaaS (Simplified)
- **Backend**: Deploy `server/` to **Render**, **Railway**, or **Heroku**.
- **Frontend**: Deploy root to **Vercel** or **Netlify**.
  - Set `Build Command`: `npm run build`
  - Set `Output Directory`: `dist`
  - Set Environment Variable `VITE_API_URL` to your backend URL.
- **Database**: Use **MongoDB Atlas**.

### Option 3: Local Network (LAN Party)
1.  Host both Backend and Frontend on a central machine.
2.  Update `VITE_API_URL` to the host's LAN IP (e.g., `http://192.168.1.50:4000`).
3.  Participants access via `http://192.168.1.50:8080`.

## API Documentation

### Key Endpoints
- **GET** `/api/events` - List active events.
- **GET** `/api/team_members` - Get members with full user details.
- **POST** `/auth/login` - Authenticate users.
- **POST** `/api/evaluate-api` - Trigger an evaluation run for a team's API.
- **POST** `/api/rounds/advance` - Admin control to move teams between rounds.

## Troubleshooting

- **"Failed to fetch" error**: Ensure the Backend server is running and `VITE_API_URL` is correct.
- **Admin Dashboard empty**: Verify you are logged in as a user with `role: 'admin'`.
- **Database connection error**: Check `MONGODB_URI` and ensure MongoDB is running.
