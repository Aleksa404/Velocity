# ⚡ Velocity

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white&style=flat-square)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-000000?logo=express&logoColor=white&style=flat-square)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.11-2D3748?logo=prisma&logoColor=white&style=flat-square)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white&style=flat-square)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Queue-DC382D?logo=redis&logoColor=white&style=flat-square)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compatible-2496ED?logo=docker&logoColor=white&style=flat-square)](https://www.docker.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com/)

**Velocity** is an enterprise-grade, full-stack video learning and workshop management platform. Designed for modern course creators and students, it provides an optimized local streaming engine, an asynchronous background video processing pipeline, and dynamic, database-driven navigation.

---

## 📽️ Core Features & Capabilities

### 1. Asynchronous Video Processing Pipeline
*   **Background Jobs (BullMQ + Redis):** Offloads heavy video operations from the main application thread to background workers, returning immediate `202 Accepted` status to users.
*   **FFmpeg Transcoding:** Automatically processes local uploads to H.264 video and AAC audio. It scales video to a maximum width of 1280px, optimizes bitrates, and injects the `-movflags +faststart` flag to support progressive downloading and instant web playback.
*   **Dual Storage Strategy:** Trainers can upload videos directly to local storage (compressed on-the-fly) or automatically publish them as unlisted videos to **YouTube** via OAuth2 and the Google APIs.

### 2. High-Performance Streaming & Playback
*   **HTTP Range Requests (HTTP 206):** The Node.js/Express server implements range request headers. This allows HTML5 players to buffer only the requested video chunks, saving network bandwidth and enabling instantaneous scrubbing/seeking.
*   **Watch Progress Synchronization:** A custom wrapper around HTML5 `<video>` and YouTube iframe players updates user progress in the database every 10 seconds and upon pausing or closing.
*   **Smart Playback Features:** 
    *   **Continue Watching:** Automatically prompts users to resume videos from where they left off.
    *   **Auto-Completion:** Marks videos as complete once a user crosses the 95% threshold.

### 3. Dynamic Database-Driven Sidebar
*   **No Code Navigation Config:** Administrators can change sidebar layouts, paths, reorder tabs, adjust visibility permissions, and select icons (Lucide icon set) directly from an interactive admin dashboard. Modifications are reflected instantly across the app without redeploying code.

### 4. Course & Role-Based Management (RBAC)
*   **Granular Authorization:** Three defined system roles (`USER`, `TRAINER`, `ADMIN`). Users can request trainer status, which admins review and approve.
*   **Workshop Enrollment Controls:** Users must request access to workshops. Trainers manage and approve enrollment queues to regulate course entry.
*   **Interactive Workshop Builder:** Trainers can create workshops, partition them into structured sections, upload instructional videos, drag-and-drop/reorder sections, and attach PDF resources.

---

## 🏗️ System Architecture

The diagram below outlines the full lifecycle of a video upload, processing, and streaming, representing the decoupled architecture between client, main backend, and Redis workers.

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (React 19)"]
        A[Trainer submits VideoForm] -->|Multipart upload| B(Vite App API Client)
        K[Student plays Video] -->|HTTP GET Request| L(VideoPlayer / HTML5 / YouTube)
    end

    subgraph Server ["Backend API (Express & Node.js)"]
        B -->|POST /api/videos| C[videoController.ts]
        C -->|Saves raw file| D[(uploads/ temporary)]
        C -->|Pushes upload job| E[videoQueue.ts]
        
        L -->|Range Header: bytes=...| M[streamVideo Route]
        M -->|HTTP 206 Partial Content| N[Stream Video Chunks]
        N -->|Pipes Buffer| L
    end

    subgraph Worker ["Worker Queue (BullMQ & Redis)"]
        E -->|BULLMQ job dequeue| F[videoWorker.ts]
        F -->|Triggers transcode| G[FFmpeg Binaries]
        G -->|Compressed output| H[(videos/ storage)]
        F -->|Or uploads to API| I[YouTube API Integration]
        F -->|Saves Metadata| J[Prisma Client]
        J -->|INSERT| KDB[(PostgreSQL Neon)]
    end
```

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand (State Management), React Router 7, Radix UI, React Hook Form, Zod (Validation), Sonner (Toasts) |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, BullMQ (Task Queue), Redis, Multer, fluent-ffmpeg, ffmpeg-static, googleapis (YouTube Data API v3), bcrypt, jsonwebtoken |
| **Database** | PostgreSQL (Neon Database) |
| **DevOps & Infrastructure** | Docker, Docker Compose, Caddy (Reverse Proxy & Automatic HTTPS), Hetzner Cloud (Ubuntu) |

---

## 💾 Database Schema Overview

The application utilizes a PostgreSQL relational database. Key models defined in the [Prisma Schema](file:///c:/Users/aleks/OneDrive/Desktop/Antigravity-Velocity/Velocity/VelocityNode/prisma/schema.prisma) include:

*   **`User`:** Handles credentials, system role (`USER`, `TRAINER`, `ADMIN`), and references to other models.
*   **`TrainerRequest`:** Manages onboarding applications for normal users looking to become course authors.
*   **`Workshop` & `WorkshopSection`:** System representing course hierarchies. Sections can have custom order parameters and duration restrictions.
*   **`WorkshopEnrollment`:** Access control mapping table validating user entry permissions into locked trainer workshops.
*   **`Video`:** Stores the video source (LOCAL or YOUTUBE), metadata, duration, parent workshop, and attachment paths (e.g. PDFs).
*   **`VideoWatchProgress`:** Tracks exact watched seconds, percentage, and completion status.
*   **`SidebarSection` & `SidebarItem`:** Configurations powering the dynamic navigation system.

---

## 🚀 Getting Started (Local Development)

To run the full stack locally, you will need **Node.js** (v18+ recommended), **Docker** (for running Redis), and a **PostgreSQL** instance.

### 1. Prerequisites Setup
Start Redis using Docker:
```bash
docker run -d --name velocity-redis -p 6379:6379 redis:alpine
```

### 2. Backend Setup (`VelocityNode`)
1. Navigate to the backend directory:
   ```bash
   cd VelocityNode
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by creating a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   JWT_SECRET="your_jwt_secret_here"
   CORS_ORIGIN="http://localhost:5173"
   
   # Optional: For YouTube integrations
   YOUTUBE_CLIENT_ID="..."
   YOUTUBE_CLIENT_SECRET="..."
   YOUTUBE_REFRESH_TOKEN="..."
   YOUTUBE_REDIRECT_URI="http://localhost:5000/oauth2callback"
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the backend developer server (runs with nodemon):
   ```bash
   npm run dev
   ```

### 3. Frontend Setup (`Velocity`)
1. Navigate to the frontend directory:
   ```bash
   cd ../Velocity
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by creating a `.env` file:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```
4. Start the frontend developer server (runs with Vite):
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Containerization & Deployment

Velocity is built to be easily containerized and deployed to a single-node Linux VPS (such as Hetzner Cloud).

### Docker Compose Architecture
The production configuration (`docker-compose.yml`) defines two services:
*   **`backend`:** Builds the Node.js application from the custom multi-stage `Dockerfile`. Runs database migrations on startup and launches both the Express web app and the BullMQ background worker.
*   **`redis`:** A standard lightweight Alpine Redis image used for BullMQ queue management.

### Caddy Reverse Proxy Configuration
To serve the app in production with automatic, free Let's Encrypt SSL certificates, use Caddy:
```caddy
api.yourdomain.com {
    reverse_proxy localhost:5000
}
```
