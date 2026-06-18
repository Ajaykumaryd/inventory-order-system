# Inventory & Order Management System

A simplified full-stack Inventory & Order Management System for managing
**products, customers, orders, and inventory tracking**.

- **Backend:** Python · FastAPI · SQLAlchemy
- **Frontend:** React (Vite) · React Router · served by nginx
- **Database:** PostgreSQL
- **Infra:** Docker + Docker Compose, configured entirely through environment variables

---

## Table of contents
1. [Features & business rules](#features--business-rules)
2. [Architecture](#architecture)
3. [Run locally (one command)](#run-locally-one-command)
4. [API reference](#api-reference)
5. [Configuration](#configuration)
6. [Deployment (free hosting)](#deployment-free-hosting)
7. [Publishing the Docker images](#publishing-the-docker-images)
8. [Submission checklist](#submission-checklist)

---

## Features & business rules

| Rule | Where enforced |
|------|----------------|
| **Product SKUs are unique** | `POST /api/products` returns `409` on duplicate; DB `UNIQUE` constraint as backstop |
| **Customer emails are unique** | `POST /api/customers` returns `409` on duplicate; DB `UNIQUE` constraint as backstop |
| **Email format validated** | Pydantic `EmailStr` |
| **Inventory validation** | Orders check stock for every line item before committing |
| **Order rejected on insufficient stock** | `POST /api/orders` returns `422` and commits **nothing** if any item exceeds available stock |
| **Automatic stock reduction** | On a successful order, each product's `stock` is decremented in the same transaction |
| **Race-safe** | Product rows are locked with `SELECT … FOR UPDATE` so two concurrent orders can't oversell |
| **Price snapshot** | `order_items.unit_price` captures price at purchase time |
| **Non-negative price/stock** | Pydantic validation + DB `CHECK` constraints |
| **Referential safety** | Can't delete a product/customer that's referenced by an order (`409`) |

Full CRUD is available for products and customers; orders support create + list with
per-item detail and an auto-computed total.

---

## Architecture

```
┌──────────────┐      /api/*       ┌──────────────┐      SQL       ┌──────────────┐
│   Frontend   │  ───────────────▶ │   Backend    │ ─────────────▶ │  PostgreSQL  │
│ React + nginx│   (nginx proxy)   │   FastAPI    │   SQLAlchemy   │              │
│   :3000      │                   │   :8000      │                │   :5432      │
└──────────────┘                   └──────────────┘                └──────────────┘
```

The frontend always calls **same-origin `/api/...`**. Locally and in production nginx
proxies those calls to the backend, so there are no hardcoded backend URLs in the
client bundle.

```
inventory-order-system/
├── docker-compose.yml          # 3 services: db, backend, frontend
├── .env.example                # all configuration (copy to .env)
├── render.yaml                 # one-click Render blueprint
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # app wiring, CORS, health, table creation
│       ├── config.py           # env-var driven settings (no secrets in code)
│       ├── database.py         # SQLAlchemy engine/session
│       ├── models.py           # Product, Customer, Order, OrderItem
│       ├── schemas.py          # Pydantic request/response models
│       ├── seed.py             # optional sample data
│       └── routers/            # products.py, customers.py, orders.py
└── frontend/
    ├── Dockerfile              # multi-stage: build with Node, serve with nginx
    ├── nginx.conf              # SPA fallback + /api reverse proxy
    └── src/
        ├── App.jsx, main.jsx
        ├── api/client.js       # tiny fetch wrapper
        └── components/         # ProductsPage, CustomersPage, OrdersPage
```

---

## Run locally (one command)

**Prerequisites:** Docker + Docker Compose.

```bash
git clone <your-repo-url>
cd inventory-order-system
cp .env.example .env          # adjust credentials if you like
docker compose up --build
```

Then open:

| Service | URL |
|---------|-----|
| Frontend (UI) | http://localhost:3000 |
| Backend API docs (Swagger) | http://localhost:8000/docs |
| Backend health | http://localhost:8000/api/health |

Optional — load sample products & customers:

```bash
docker compose exec backend python -m app.seed
```

Stop everything:

```bash
docker compose down          # add -v to also wipe the database volume
```

---

## API reference

Base path: `/api`

### Products
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products` | list all |
| GET | `/api/products/{id}` | single |
| POST | `/api/products` | `{sku, name, description?, price, stock}` — `409` on duplicate SKU |
| PUT | `/api/products/{id}` | update name/description/price/stock |
| DELETE | `/api/products/{id}` | `409` if referenced by an order |

### Customers
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/customers` | list all |
| GET | `/api/customers/{id}` | single |
| POST | `/api/customers` | `{name, email, phone?, address?}` — `409` on duplicate email |
| PUT | `/api/customers/{id}` | update name/phone/address |
| DELETE | `/api/customers/{id}` | `409` if customer has orders |

### Orders
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/orders` | list all (with items) |
| GET | `/api/orders/{id}` | single |
| POST | `/api/orders` | `{customer_id, items:[{product_id, quantity}]}` — `422` on insufficient stock, reduces stock on success |

Example — place an order:

```bash
curl -X POST http://localhost:8000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"customer_id":1,"items":[{"product_id":1,"quantity":3}]}'
```

---

## Configuration

All configuration is via environment variables (see `.env.example`). **No credentials
are hardcoded.** Key variables:

| Variable | Used by | Purpose |
|----------|---------|---------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | db, backend | database credentials |
| `DATABASE_URL` | backend | full SQLAlchemy URL (compose builds it from the above) |
| `CORS_ORIGINS` | backend | comma-separated allowed origins, or `*` |
| `BACKEND_URL` | frontend (nginx) | where to proxy `/api` |
| `BACKEND_PORT` / `FRONTEND_PORT` / `POSTGRES_PORT` | compose | host port mappings |

The backend respects a platform-provided `$PORT` (Render/Railway), and the frontend
nginx config templates `${PORT}` and `${BACKEND_URL}` at container start.

---

## Deployment (free hosting)

Both services are plain Docker images, so they run on any container host. Below is a
tested, fully-free path. **You must do these steps with your own accounts** — they
require logins I can't perform for you.

### Option A — Render Blueprint (everything in one repo)

1. Push this repo to GitHub.
2. Go to **dashboard.render.com → New → Blueprint** and select the repo.
   Render reads [`render.yaml`](./render.yaml) and provisions:
   - a free **PostgreSQL** instance,
   - the **backend** web service (Docker),
   - the **frontend** web service (Docker).
3. After the backend deploys, set the frontend's `BACKEND_URL` env var to the backend's
   **full URL including scheme**, e.g. `https://iom-backend.onrender.com`, and set the
   backend's `CORS_ORIGINS` to the frontend's full URL. Then "Manual Deploy → Clear
   build cache & deploy" the frontend. (Render's `fromService host` gives a bare
   hostname; the proxy needs the `https://` prefix, so confirm this value.)

> Render free web services sleep after inactivity and cold-start in ~30–60s — fine for
> a demo. The free Postgres is time-limited; recreate it if it expires.

### Option B — Split hosting (backend on Render, frontend on Vercel/Netlify)

**Backend + DB on Render:**
1. New → PostgreSQL (free). Copy its **Internal Database URL**.
2. New → Web Service → "Deploy from a Docker image" (or from repo, root `backend/`).
   Set env vars:
   - `DATABASE_URL` = the Postgres URL (works as `postgresql://…`)
   - `CORS_ORIGINS` = your frontend URL (set after step below)
   - health check path: `/api/health`

**Frontend on Vercel or Netlify** (static build, talks directly to the backend URL):
1. Import the repo, set the project root to `frontend/`.
2. Build command `npm run build`, output dir `dist`.
3. Add build-time env var `VITE_API_BASE_URL=https://<your-backend>.onrender.com`
   (this makes the client call the backend directly instead of a same-origin proxy).
4. Deploy, then go back and set the backend's `CORS_ORIGINS` to the Vercel/Netlify URL
   and redeploy the backend.

### Option C — Railway / Fly.io
Both support `docker-compose`-style or per-service Docker deploys; point each service at
its `Dockerfile` and set the same env vars as above.

---

## Publishing the Docker images

To produce the **Docker image link** for submission (Docker Hub example):

```bash
docker login

# Backend
docker build -t <your-dockerhub-username>/iom-backend:1.0 ./backend
docker push <your-dockerhub-username>/iom-backend:1.0

# Frontend
docker build -t <your-dockerhub-username>/iom-frontend:1.0 ./frontend
docker push <your-dockerhub-username>/iom-frontend:1.0
```

Your image links will be:
`https://hub.docker.com/r/<your-dockerhub-username>/iom-backend` (and `…/iom-frontend`).

---

## Submission checklist

- [ ] **GitHub repo** — push this folder to a new public repo.
- [ ] **Docker image link** — push images to Docker Hub (commands above).
- [ ] **Live URLs** — deploy via one of the options above; capture the frontend and
      backend (`/docs`) public URLs.
- [ ] Confirm `.env` is **not** committed (it's in `.gitignore`); only `.env.example` is.

> ⚠️ I built and verified the entire application and Docker setup locally, but I can't
> push to your GitHub, publish to your Docker Hub, or deploy to your hosting accounts —
> those require your credentials. Run the clearly-marked steps above to complete those
> three deliverables.
