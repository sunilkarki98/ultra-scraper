# Ultra-Scraper Monorepo

Production-ready web scraping service with multi-user authentication, AI extraction, and webhooks.

---

## 📁 Project Structure

```
ultra-scraper/
├── backend/              # API Server (Node.js + TypeScript)
│   ├── src/              # Source code
│   │   ├── api/          # Express routes & controllers
│   │   ├── jobs/         # BullMQ workers
│   │   ├── scrapers/     # Playwright/Puppeteer scrapers
│   │   ├── services/     # Business logic (user, auth)
│   │   ├── middlewares/  # Auth, rate limiting, quota
│   │   └── utils/        # Helpers (Redis, logger, LLM)
│   ├── public/           # Static files served by backend
│   ├── dist/             # Compiled JavaScript (build output)
│   ├── package.json      # Backend dependencies
│   └── tsconfig.json     # TypeScript config
│
├── frontend/             # Dashboard UI (HTML + React)
│   ├── admin.html        # Admin dashboard
│   ├── dashboard.html    # User dashboard
│   └── package.json      # Frontend dependencies
│
├── package.json          # Root workspace config
└── README.md             # This file
```

---

## 🚀 Quick Start

### Option 1: Run Everything (Recommended)

```bash
# Install all dependencies
npm install

# Run backend only (default)
npm run dev

# Run backend + frontend separately
npm run dev:backend  # Terminal 1 - API on port 3000
npm run dev:frontend # Terminal 2 - Dashboards on port 3001
```

### Option 2: Run Individually

**Backend (API Server)**:
```bash
cd backend
npm install
npm run dev
```

**Frontend (Dashboards)**:
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **API** | `http://localhost:3000` | Scraping API endpoints |
| **Admin Dashboard** | `http://localhost:3000/admin.html` | Manage users (via backend) |
| **User Dashboard** | `http://localhost:3000/dashboard.html` | Customer portal (via backend) |
| **BullMQ Dashboard** | `http://localhost:3000/admin/queues` | Job queue monitoring |
| **Frontend Dev Server** | `http://localhost:3001` | Standalone dashboards (dev) |

---

## 📦 Backend

**What it does**:
- REST API for scraping
- User authentication (API keys)
- Rate limiting & quota management
- BullMQ job processing
- AI/LLM integration
- Webhook delivery

**Tech Stack**:
- Node.js + TypeScript
- Express.js
- BullMQ + Redis
- Playwright + Puppeteer
- Zod (validation)

**Main Files**:
- `src/api/server.ts` - Express server
- `src/jobs/workerProcessor.ts` - Job worker
- `src/services/user.service.ts` - User management

---

## 🎨 Frontend

**What it does**:
- Admin dashboard (manage users, view stats)
- User dashboard (view usage, manage API keys)

**Tech Stack**:
- HTML + React (via CDN)
- Tailwind CSS
- Chart.js
- Alpine.js (admin)

**Main Files**:
- `admin.html` - Admin interface
- `dashboard.html` - User interface

---

## 🏗️ Development Workflow

### Making Changes

**Backend Changes**:
```bash
cd backend
# Edit src/ files
npm run build  # Compile TypeScript
npm run dev    # Run with auto-reload
```

**Frontend Changes**:
```bash
cd frontend
# Edit .html files
# Changes are instant (no build step)
```

---

## 🐳 Deployment

### Docker Deployment

```bash
# Build image
npm run docker:build

# Start with docker-compose
npm run docker:up

# Or manually
cd backend
docker build -t ultra-scraper -f Dockerfile.optimized .
docker-compose -f docker-compose.production.yml up -d
```

### Manual Deployment

```bash
# Build backend
cd backend
npm run build

# Start production server
npm start
```

---

## 📚 API Documentation

### Scraping Endpoints

**POST /scrape**
```bash
curl -X POST http://localhost:3000/scrape \
  -H "X-API-Key: sk_..." \
  -d '{"url": "https://example.com"}'
```

**GET /job/:id**
```bash
curl http://localhost:3000/job/abc123
```

### User Management

**POST /users/register**
```bash
curl -X POST http://localhost:3000/users/register \
  -d '{"email": "user@example.com"}'
```

**GET /users/me**
```bash
curl -H "X-API-Key: sk_..." \
  http://localhost:3000/users/me
```

---

## 🔧 Configuration

**Backend** (`.env`):
```bash
PORT=3000
REDIS_URL=redis://localhost:6379
ADMIN_API_KEY=your_admin_key
OPENAI_API_KEY=sk_...  # Optional
```

**Frontend** (`frontend/.env`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Integration tests
npm run test:integration
```

---

## 📊 Monitoring

- **Admin Dashboard**: View system stats, manage users
- **BullMQ Dashboard**: Monitor job queues
- **Logs**: Check `backend/logs/` or use `docker logs`

---

## 🛡️ Security

1. **API Keys**: Never commit to Git
2. **Admin Key**: Change default in production
3. **HTTPS**: Use in production
4. **Rate Limiting**: Prevents abuse
5. **Quota Management**: Per-user limits

---

## 📖 Full Documentation

See `/docs` folder for:
- API Reference
- Architecture Guide
- Deployment Guide
- Webhook Guide
- LLM Integration Guide

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes in `backend/` or `frontend/`
4. Test thoroughly
5. Submit pull request

---

## 📝 License

MIT License - See LICENSE file

---

## 🆘 Support

- Documentation: Check `/docs`
- Issues: GitHub Issues
- Email: your-email@example.com

---

**Built with ❤️ using Node.js, React, and Playwright**
