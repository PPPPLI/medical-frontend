## How to Run (Frontend)

The frontend is an Angular application.  
It can be started either locally with Node.js or using Docker Compose.

### Option 1 — Run locally (recommended for development)

#### Prerequisites
- Node.js 18+ (or 20+)
- npm (or pnpm/yarn)

#### Install dependencies
```bash
npm install
```

#### Start the Angular dev server
```bash
npm start
```

The application will be available at:
- http://localhost:4200


---

### Option 2 — Run with Docker Compose

#### Prerequisites
- Docker
- Docker Compose

#### Start the container
From the directory docker that contains the `docker-compose.yml` file:

```bash
docker compose up --build
```

The application will be available at:
- http://localhost:4200

#### Stop the container
```bash
docker compose down
```
