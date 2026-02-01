# AI Battle Arena 2026 ⚔️

**Live Demo: [www.aibattlearena.in](https://www.aibattlearena.in)**

A professional, scalable tournament platform designed to evaluate RAG-based (Retrieval-Augmented Generation) AI agents in real-time. Built for competitive AI benchmarking with automated judging and live performance tracking.

## 🚀 Key Features

- **Dynamic Participant Portal**: Teams can submit API endpoints, test their models live, and track their tournament history.
- **Advanced Admin Dashboard**: Powerful tools for organizers to manage teams, shortlist participants, and trigger automated battle rounds.
- **AI-Powered Evaluation**: Integration with **Anthropic Claude** (the "Battle Judge") for objective, deterministic match verdicts.
- **Real-time Performance Metrics**:
  - **Accuracy & Relevance**: Semantic similarity and ground truth matching.
  - **Efficiency**: Latency tracking (score-weighted).
  - **Stability**: API uptime and valid JSON response verification.
- **Multi-Round Tournament System**: Support for a 5-round progression system (Fundamentals, Basic, Medium, Expert, and Multilingual rounds).

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion (Animations), Recharts (Analytics).
- **Backend**: Node.js, Express, MongoDB (Atlas).
- **AI Engine**: Anthropic SDK (Claude-3-Haiku judging engine).
- **Deployment**: Configured for Vercel (Frontend) and standard Node.js environments (Backend).

## 📥 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Anthropic API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-arena.git
   cd ai-arena
   ```

2. **Setup the Backend**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and Anthropic API Key
   npm start
   ```

3. **Setup the Frontend**:
   ```bash
   cd ..
   npm install
   cp .env.example .env
   # Ensure VITE_API_URL points to your backend (default: http://localhost:4000)
   npm run dev
   ```

## 🏗️ Core Architecture

### Tournament Service
The backend features a robust `tournamentService.js` that handles parallel evaluation of team APIs. During a match:
1. Both team endpoints are queried simultaneously.
2. Responses are analyzed by the AI Judge against the round's context and ground truth.
3. Resulting scores are logged to MongoDB and updated on the live leaderboard.

### Round Progression
The platform is pre-configured with 5 distinct tournament rounds, each increasing in complexity:
- **Round 1**: RAG Fundamentals
- **Round 2**: Basic Understanding
- **Round 3**: Medium Comprehension
- **Round 4**: Expert-Level Reasoning
- **Round 5**: Multilingual Synthesis

## 🔧 Environment Variables

### Backend (`server/.env`)
| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Connection string for your MongoDB database. |
| `DB_NAME` | Name of the database (default: `ai_arena`). |
| `JWT_SECRET` | Secret key for JWT authentication. |
| `ANTHROPIC_API_KEY` | Your Claude API key for model evaluation. |

### Frontend (`.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | The base URL of the running backend server. |

## 📜 License
This project is private and intended for sanctioned AI Battle Arena events. Refer to the event organizer for specific usage rights.
