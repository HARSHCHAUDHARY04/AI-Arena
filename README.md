# AI Battle Arena 2026 ⚔️
Admin Credentials: admin@aibattlearena.in | AdminPassword123!
**Live Demo: [www.aibattlearena.in](https://www.aibattlearena.in)**

AI Battle Arena is a professional, high-performance benchmarking platform designed to evaluate RAG-based (Retrieval-Augmented Generation) AI agents in real-time. Built specifically for competitive AI benchmarking, it features automated judging, live performance tracking, and a high-concurrency evaluation engine.

---

## 🚀 Key Features

- **Parallel Evaluation Engine**: Leverages Node.js concurrency to test dozens of participant APIs simultaneously.
- **AI-Powered Deterministic Judging**: Uses **Anthropic Claude-3-Haiku** with a custom 5-point rubric to provide consistent, objective match verdicts.
- **Real-time Performance Metrics**:
  - **Context Relevance**: Verifying the agent uses the provided data.
  - **Groundedness**: Preventing hallucinations.
  - **Accuracy**: Semantic matching against "Ground Truth."
  - **Latency & Stability**: Score-weighted speed and uptime tracking.
- **Advanced Admin Control**: full lifecycle management from team shortlisting to round advancement.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Recharts.
- **Backend**: Node.js, Express, MongoDB.
- **AI Judge**: Anthropic SDK (Claude).
- **Quality Assurance**: 60s Timeout controllers, JSON schema validation, parallel execution monitoring.

---

## 🏗️ Core Architecture: The Evaluation Pipeline

The heart of the project is the **distributed evaluation pipeline**. Unlike traditional sequential testing, AI Battle Arena uses a parallel batching system:

1.  **Request Batching**: Uses `Promise.allSettled` to fire requests to all competing APIs in a round at once.
2.  **Fault-Tolerant Fetching**: Implements `AbortController` timeouts to ensure one slow API doesn't hang the entire tournament.
3.  **Judicial Evaluation**: Aggregates answers and sends them to the Anthropic Judge for deterministic scoring.
4.  **Persistent Storage**: Atomically updates MongoDB with scores, logs, and round telemetry.

> [!IMPORTANT]
> **Performance Impact**: This parallel architecture reduced the total evaluation time per round by approximately **50%** compared to sequential processing.

---

## 🧪 QA & Reliability

This project was built with a **QA-first mindset**. We focused on three main pillars of stability:

- **Graceful Failure**: The system treats API timeouts or malformed JSON as a "Stable 0" rather than a system crash.
- **Judge Calibration**: By setting AI parameters like `temperature: 0` and providing context-rich prompts, we achieved **85%+ consistency** in grading.
- **Data Integrity**: Uses MongoDB atomic operations to ensure scoreboard accuracy even during high-concurrency match completions.

For more details, see our [TESTING.md](./TESTING.md).

---

## 📥 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or Local)
- Anthropic API Key

### Installation

1.  **Clone & Install Dependencies**:
    ```bash
    git clone https://github.com/HARSHCHAUDHARY04/AI-Arena.git
    cd AI-Arena
    npm install
    cd server && npm install
    ```

2.  **Environment Setup**:
    - Create a `.env` in the `server` directory using `.env.example`.
    - Create a `.env` in the root directory for `VITE_API_URL`.

3.  **Running Locally**:
    - **Backend**: `cd server && node index.js` (Running on port 4000)
    - **Frontend**: `npm run dev` (Running on port 8080)

---

## 🛡️ Administrative Access

The platform uses Role-Based Access Control (RBAC). For testing purposes, an admin account can be initialized to manage the tournament environment.

---

## 📜 License
This project is private and intended for sanctioned AI Battle Arena events. 
© 2026 AI Battle Arena Team.
