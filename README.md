# CI/CD Pipeline Demo

A production-style CI/CD pipeline project using **Node.js**, **Docker** (multi-stage build), and **GitHub Actions**.

---

## Project Structure

```
cicd-demo/
├── src/
│   ├── app.js            # Express app (routes)
│   └── server.js         # Entry point (binds port)
├── tests/
│   └── app.test.js       # Jest + Supertest integration tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml     # GitHub Actions pipeline
├── Dockerfile            # Multi-stage build
├── docker-compose.yml    # Local dev setup
├── .dockerignore
└── package.json
```

---

## Quick Start

### Run locally (no Docker)
```bash
npm install
npm test          # Run tests
npm start         # Start server on :3000
```

### Run with Docker
```bash
# Build the image
docker build -t cicd-demo .

# Run the container
docker run -p 3000:3000 cicd-demo

# Test the health endpoint
curl http://localhost:3000/health
```

### Run with Docker Compose
```bash
# Start the app
docker-compose up

# Run tests inside a container
docker-compose --profile test up test
```

---

## API Endpoints

| Method | Path          | Description              |
|--------|---------------|--------------------------|
| GET    | `/health`     | Health check (used by Docker HEALTHCHECK) |
| GET    | `/api/greet`  | Returns a greeting. `?name=Alice` |
| POST   | `/api/echo`   | Echoes back the request body |

---

## CI/CD Pipeline Overview

```
Developer pushes code
        │
        ▼
┌─────────────────────────────────────┐
│  GitHub Actions triggers on push    │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │  JOB 1: Test│  ← runs on every push & PR
        │  npm ci      │
        │  npm test    │
        │  (coverage)  │
        └──────┬───────┘
               │  if tests pass AND branch = main
        ┌──────▼──────────────┐
        │  JOB 2: Build+Push  │  ← only on push to main
        │  docker build       │
        │  docker push → GHCR │
        └──────┬──────────────┘
               │
        ┌──────▼──────────────┐
        │  JOB 3: Deploy      │  ← requires build success
        │  (stub → replace    │
        │   with k8s/ECS/SSH) │
        └─────────────────────┘
```

---

## Dockerfile — Multi-Stage Build Explained

```
Stage 1 (builder):  node:20-alpine
  ├── npm ci (all deps including devDeps)
  ├── COPY all source
  └── npm test  ← tests run during BUILD

Stage 2 (production):  node:20-alpine (fresh)
  ├── npm ci --only=production (no Jest, no Supertest)
  ├── COPY --from=builder /app/src  (only source, not tests)
  ├── Non-root user (security)
  ├── EXPOSE 3000
  └── HEALTHCHECK
```

**Why multi-stage?**
- Final image doesn't contain test frameworks (~50% smaller)
- Tests are enforced at build time — can't push a failing image
- Non-root user follows least-privilege principle

---

## 🎙️ Interview Talking Points

### "Walk me through your CI/CD pipeline"

> "When a developer pushes to any branch, GitHub Actions triggers a **Test** job. It installs dependencies using `npm ci` — not `npm install` — because `ci` uses the lock file exactly, giving deterministic, reproducible installs. Tests run with coverage. If a PR, the pipeline stops there.
>
> On a push to `main`, if tests pass, a **Build** job runs. It uses Docker Buildx with GitHub Actions layer caching to build a multi-stage image and push it to GHCR tagged with both the commit SHA and `latest`. The SHA tag is critical — it makes every deploy traceable back to an exact commit.
>
> Finally, a **Deploy** job runs against a protected `production` environment, which can require manual approval in GitHub. In a real system this would issue a `kubectl set image` or `aws ecs update-service` command."

### "Why multi-stage Docker builds?"

> "Two reasons: size and security. The builder stage installs all dev dependencies and runs tests. The final production stage starts from a clean Alpine image and only copies the compiled source — no Jest, no Supertest, no extra attack surface. The final image is roughly half the size. I also add a non-root user following least-privilege and a HEALTHCHECK so orchestrators like Kubernetes know when the app is actually ready."

### "What's the difference between `npm install` and `npm ci`?"

> "`npm install` can update `package-lock.json` if there's any drift. `npm ci` always installs exactly what's in the lock file and fails if there's a mismatch. In CI you always want `npm ci` — reproducibility is everything."

### "How do you handle secrets?"

> "GitHub Actions provides `GITHUB_TOKEN` automatically for pushing to GHCR. For other secrets — database URLs, API keys — I use GitHub repository secrets, accessed via `${{ secrets.MY_SECRET }}`. They're never logged. In production I'd store them in a vault like AWS Secrets Manager or HashiCorp Vault, injected at runtime as environment variables."

### "What would you add to make this production-grade?"

> "A few things: a linting step (`eslint`) before tests, semantic versioning with tags instead of just SHA, a staging environment between build and production, automated rollback if the health check fails after deploy, and integration with an observability stack — Prometheus metrics, structured JSON logging with a correlation ID, and distributed tracing."
