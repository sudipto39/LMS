# Self-Hosted Deployment Guide for University Server (`10.0.22.109`)

This guide explains how to deploy the entire GiteaForge LMS platform on the on-premise university Ubuntu server (`10.0.22.109`).

---

## 1. Architecture Overview

All services run self-contained on the server:
| Service | Port | Description |
|---|---|---|
| **LMS Frontend** | `5173` or `80` | Vite React Single Page App |
| **LMS Backend** | `5000` | Node.js Express API & WebSocket |
| **LMS PostgreSQL** | `5432` | Relational database |
| **LMS Redis** | `6379` | In-memory cache & rate limiter |
| **Gitea Git Server** | `3000` | Academic Git repositories & webhooks |
| **Judge0 Compiler** | `2358` | Multi-language code sandbox |
| **Local Uploads** | `server/uploads/` | Student PDF reports & faculty manuals |

---

## 2. Server Prerequisites

On the Ubuntu server (`10.0.22.109`):
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Install Node.js 20 LTS & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 3. Clone Repository & Setup Services

```bash
# 1. Clone your project to the server
git clone <your-repo-url> /opt/lms
cd /opt/lms

# 2. Start Supporting Infrastructure (Gitea, Judge0, Postgres, Redis)
docker compose -f docker-compose.self-hosted.yml up -d

# Verify containers are running
docker compose -f docker-compose.self-hosted.yml ps
```

---

## 4. Configure Backend Environment

```bash
cd /opt/lms/server
cp .env.production.self-hosted.example .env

# Generate secure JWT secrets:
openssl rand -base64 48
# Paste output into JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env

# Install dependencies & generate prisma client
npm install
npx prisma db push
npm run build

# Start backend using PM2
pm2 start dist/index.js --name "lms-backend"
pm2 save
pm2 startup
```

---

## 5. Configure Frontend

```bash
cd /opt/lms/frontend
cp .env.production.self-hosted.example .env.production

npm install
npm run build

# Serve frontend using PM2 or Nginx
pm2 serve dist 5173 --spa --name "lms-frontend"
pm2 save
```

---

## 6. Verification & Port Access

Open your browser from any device on the university network:
- **LMS Application**: `http://10.0.22.109:5173`
- **Backend Health Check**: `http://10.0.22.109:5000/health`
- **Gitea Instance**: `http://10.0.22.109:3000`
- **Judge0 Engine**: `http://10.0.22.109:2358/about`
