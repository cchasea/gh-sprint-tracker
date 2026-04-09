# GitHub Sprint Tracker
<p align="center">
  <img src="images/gh-sprint-tracker.png" width="60%" />
</p>

A **full-stack web application** that analyzes GitHub repositories to visualize sprint velocity and issue burndown for software teams.

---

##  Features
-  **GitHub OAuth login** for secure authentication  
-  **Repository tracking** and issue synchronization via GitHub API  
-  **Metrics endpoint** returning burndown and velocity data (velocity in progress) 
-  **Prisma ORM** + **PostgreSQL** for reliable data storage  
-  Built with **Fastify** and **TypeScript** 

---

## Tech 
| Category | Technologies |
|-----------|--------------|
| **Backend** | Fastify, TypeScript, Prisma, PostgreSQL |
| **Auth** | GitHub OAuth |
| **Frontend (planned)** | React, Chart.js |
| **Hosting** | Local / GitHub Codespaces |

---

##  Setup Instructions

### 1️ Clone the Repository
```bash
git clone https://github.com/cchasea/gh-sprint-tracker.git
cd gh-sprint-tracker/api
npm install
````

### 2 Configure Environment Variables

Create a `.env` file in `/api` with the following content:

```bash
DATABASE_URL="postgresql://dev:dev@localhost:5432/ghtracker"
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your_64_character_secret
```

### 3 Start PostgreSQL (Example using Docker)

```bash
docker run --name pg \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=ghtracker \
  -p 5432:5432 \
  -d postgres:16
```

### 4️ Push Prisma Schema and Start Server

```bash
npx prisma db push
npm run dev
```

---

## API Endpoints

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| `GET`  | `/healthz`              | Health check                    |
| `GET`  | `/auth/github`          | Initiate OAuth login            |
| `GET`  | `/auth/github/callback` | OAuth redirect                  |
| `GET`  | `/me`                   | Get current authenticated user  |
| `GET`  | `/repos`                | List GitHub repositories        |
| `POST` | `/track`                | Start tracking a repository     |
| `POST` | `/sync/:owner/:name`    | Sync GitHub issues for a repo   |
| `GET`  | `/metrics/:owner/:name` | Get burndown & velocity metrics |

---

## Example Output

**Burndown Sample**




## Project Status

In Progress. Backend and Frontend functional. Working on more including more metrics besides burndown.

---
