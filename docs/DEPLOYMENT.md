# GiteaForge LMS — Production Deployment Guide

This guide details the procedures for deploying the **GiteaForge LMS** platform in university on-premise environments or cloud virtual machines.

---

## 1. Deployment Topologies

GiteaForge supports two primary deployment models:

| Topology | Best For | Storage & Infrastructure | Cost Profile |
|---|---|---|---|
| **Option A: Full Self-Hosted (On-Premise)** | Universities requiring total data sovereignty and zero recurring cloud costs. | Dedicated Ubuntu 22.04/24.04 server; local SSD storage; Docker Compose stack. | **Zero cloud bills**; runs on institutional hardware. |
| **Option B: Hybrid Cloud (VM + Cloud Run)** | Institutions desiring managed scaling and global student access. | GCP Compute Engine VM (Gitea + Judge0) + GCP Cloud Run (Backend API) + Neon PG + Vercel (SPA). | Pay-as-you-go cloud compute. |

---

## 2. Option A: Full On-Premise Deployment (Recommended)

### Hardware Requirements
- **CPU**: 4 to 8 Cores (recommended for simultaneous Judge0 execution jobs)
- **RAM**: 16 GB minimum (8 GB absolute minimum for small cohorts)
- **Disk**: 100+ GB SSD (for Git repositories, Docker containers, and PostgreSQL data)
- **Operating System**: Ubuntu 22.04 LTS or 24.04 LTS

### Step 1: Install System Prerequisites
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Clone the Repository
```bash
git clone https://github.com/sudipto39/LMS.git /opt/giteaforge
cd /opt/giteaforge
```

### Step 3: Configure Self-Hosted Infrastructure Environment
Create `/opt/giteaforge/.env`:
```env
# Database Credentials
POSTGRES_DB=lms_db
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=generate-a-strong-postgres-password

# Judge0 Credentials
JUDGE0_POSTGRES_PASSWORD=generate-a-strong-judge0-password
```

Start the containerized infrastructure:
```bash
docker compose -f docker-compose.self-hosted.yml up -d
```

Verify all 7 containers are healthy:
```bash
docker compose -f docker-compose.self-hosted.yml ps
```

### Step 4: Configure Backend Environment
Navigate to `server/` and create `.env`:
```env
NODE_ENV=production
PORT=5000
SERVER_HOST=localhost

# PostgreSQL Connection
DATABASE_URL="postgresql://lms_user:YOUR_POSTGRES_PASSWORD@127.0.0.1:5432/lms_db?schema=public"

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Local Storage (Zero Cloud Cost)
STORAGE_TYPE=local
UPLOAD_DIR=uploads

# JWT Secrets (generate with: openssl rand -base64 48)
JWT_ACCESS_SECRET=your-32-character-access-secret
JWT_REFRESH_SECRET=your-32-character-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Gitea Integration
GITEA_BASE_URL=http://127.0.0.1:3000/api/v1
GITEA_WEBHOOK_SECRET=your-chosen-gitea-webhook-secret
GITEA_ADMIN_TOKEN=your-gitea-admin-access-token

# Judge0 Integration
JUDGE0_URL=http://127.0.0.1:2358

# Email / Notifications (Free SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-university-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
EMAIL_FROM=GiteaForge LMS <no-reply@youruniversity.edu>
EMAIL_VERIFICATION=false

# Allowed Frontend Origins (CORS)
CLIENT_URL=https://lms.youruniversity.edu
```

### Step 5: Initialize Database & Build Backend
```bash
cd /opt/giteaforge/server
npm ci
npm run db:migrate:prod
npm run db:seed
npm run build
```

Run the backend via `systemd` or PM2:
```bash
sudo npm install -g pm2
pm2 start dist/index.js --name "giteaforge-api"
pm2 save
pm2 startup
```

### Step 6: Build the Frontend Client
```bash
cd /opt/giteaforge/client
cat <<EOF > .env
VITE_API_BASE_URL=https://lms.youruniversity.edu/api/v1
VITE_GITEA_URL=https://git.youruniversity.edu
EOF

npm ci
npm run build
```
The compiled SPA is located at `/opt/giteaforge/client/dist`.

---

## 3. Nginx Reverse Proxy & SSL Configuration

Configure Nginx to serve the frontend SPA and route API requests and Git traffic securely:

```nginx
# /etc/nginx/sites-available/giteaforge.conf

# 1. LMS Web Application & API
server {
    server_name lms.youruniversity.edu;

    root /opt/giteaforge/client/dist;
    index index.html;

    client_max_body_size 50M;

    # Static SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API routing
    location /api/v1/ {
        proxy_pass http://127.0.0.1:5000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Documentation (Swagger)
    location /api-docs {
        proxy_pass http://127.0.0.1:5000/api-docs;
        proxy_set_header Host $host;
    }
}

# 2. Self-Hosted Gitea Service
server {
    server_name git.youruniversity.edu;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and acquire SSL certificates:
```bash
sudo ln -s /etc/nginx/sites-available/giteaforge.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue free Let's Encrypt certificates
sudo certbot --nginx -d lms.youruniversity.edu -d git.youruniversity.edu
```

---

## 4. Option B: Hybrid Cloud Deployment (GCP VM + Serverless)

For institutions deploying on Google Cloud Platform:

1. **Deploy VM for Gitea & Judge0**:
   - Create an `e2-standard-4` VM in GCP Compute Engine.
   - Upload `docker-compose.gcp-vm.yml`:
     ```bash
     scp docker-compose.gcp-vm.yml user@<VM_IP>:~/
     ssh user@<VM_IP> "docker compose -f docker-compose.gcp-vm.yml up -d"
     ```
   - Open ports `3000` (Gitea) and `2358` (Judge0) in VPC firewall rules.
2. **Deploy Backend to Google Cloud Run**:
   - The repository includes `server/Dockerfile` optimized for Cloud Run.
   - Deploy using Google Cloud SDK:
     ```bash
     gcloud run deploy giteaforge-api \
       --source ./server \
       --platform managed \
       --region asia-south1 \
       --allow-unauthenticated
     ```
3. **Deploy Client to Vercel**:
   - The client includes `client/vercel.json` with SPA rewrites.
   - Run `vercel` from the `client/` folder.

---

## 5. Maintenance & Disaster Recovery

### Database Backup
```bash
# Automated daily backup script
docker exec -t lms-postgres pg_dump -U lms_user lms_db | gzip > /opt/backups/lms_db_$(date +%F).sql.gz
```

### Git Repository Backup
```bash
# Archive Gitea persistent volume
tar -czvf /opt/backups/gitea_data_$(date +%F).tar.gz /var/lib/docker/volumes/giteaforge_gitea_data/_data
```

### Health Check Monitoring
Verify system status anytime:
```bash
curl -I https://lms.youruniversity.edu/api/v1/health
```
Internal monitoring with secret key:
```bash
curl -H "X-Health-Key: YOUR_HEALTH_CHECK_KEY" https://lms.youruniversity.edu/api/v1/health
```

