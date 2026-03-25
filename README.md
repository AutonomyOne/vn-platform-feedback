# platform-feedback

Single-import feedback SDK for all platform microservices.
Auto-detects framework. Zero config beyond 5 env vars.

## Repository Structure

This is a monorepo containing both the Python and JS SDKs:

```
vn-platform-feedback/
    python/   ← Python SDK (FastAPI, Starlette, Django, Flask, Streamlit, Headless)
    js/       ← JS SDK (Next.js, React, Vue 3, Angular 17+, Express, Browser)
```

All development happens on the `dev` branch. On merge to `main`, CI automatically
publishes clean dist branches that consumers install from:

- **`js-dist`** — contains only the JS SDK (no tests, no dev tooling)
- **`python-dist`** — contains only the Python SDK (no tests, no dev tooling)

These dist branches are managed by CI and should never be edited directly.

## Install

### Python

```bash
# Latest from main
pip install git+https://github.com/AutonomyOne/vn-platform-feedback.git@python-dist

# Pinned to a specific version
pip install git+https://github.com/AutonomyOne/vn-platform-feedback.git@python-v0.1.0
```

Or in `requirements.txt`:
```
platform-feedback @ git+https://github.com/AutonomyOne/vn-platform-feedback.git@python-dist
```

### JS / Next.js / Vue / Angular

```bash
# Latest from main
npm install github:AutonomyOne/vn-platform-feedback#js-dist

# Pinned to a specific version
npm install github:AutonomyOne/vn-platform-feedback#js-v0.1.0
```

Or in `package.json`:
```json
{
  "dependencies": {
    "platform-feedback": "github:AutonomyOne/vn-platform-feedback#js-dist"
  }
}
```

### Checking the installed version

```javascript
import { version } from 'platform-feedback'
console.log(version) // "0.1.0"
```

```python
from platform_feedback import __version__
print(__version__)  # "0.1.0"
```

## Required Env Vars

All frameworks use the same env var names. For Next.js, prefix with `NEXT_PUBLIC_`.
For Vite, prefix with `VITE_`. See `.env.example` for all variations.

```env
FEEDBACK_SERVICE_URL=https://feedback.yourplatform.com
FEEDBACK_API_KEY=your-secret-key
FEEDBACK_APP_NAME=vetceedr
FEEDBACK_MICROSERVICE=backend        # or frontend, auth, api, etc.
FEEDBACK_ENV=staging                 # staging | production
```

---

## Usage By Framework

### FastAPI
```python
from platform_feedback import init_feedback
init_feedback(app)   # done — exception handler auto-installed
```

### Starlette
```python
from platform_feedback import init_feedback
init_feedback(app)   # done — middleware auto-installed
```

### Django
```python
# settings.py
MIDDLEWARE = [
    ...
    'platform_feedback.integrations.django.DjangoFeedbackMiddleware',
]

# apps.py
from platform_feedback import init_feedback
class MyAppConfig(AppConfig):
    def ready(self):
        init_feedback()
```

### Flask
```python
from platform_feedback import init_feedback
init_feedback(app)   # done — error handler auto-installed
```

### Streamlit
```python
from platform_feedback import init_feedback
integration = init_feedback()
integration.render_sidebar(
    user_id=st.session_state.get("user_id"),
    current_page="Patient Records",
)
```

### Headless (Celery, cron, scripts)
```python
from platform_feedback import init_feedback
integration = init_feedback()

try:
    run_job()
except Exception as e:
    integration.submit_error(e, context={"job": "nightly_sync"})
```

---

### Next.js

The SDK ships raw JSX source. Add `transpilePackages` to your `next.config.mjs`:

```javascript
// next.config.mjs
const nextConfig = {
  transpilePackages: ['platform-feedback'],
}
export default nextConfig
```

Then use in your app:

```javascript
// app/layout.jsx
import { initFeedback } from 'platform-feedback'
import { FeedbackButton } from 'platform-feedback/components'
initFeedback()

export default function Layout({ children }) {
  return (
    <>
      {children}
      <FeedbackButton user={currentUser} />
    </>
  )
}

// app/error.jsx — App Router global error boundary
import { onAppError } from 'platform-feedback'
export default function GlobalError({ error }) {
  onAppError(error)
  return <html><body><h2>Something went wrong</h2></body></html>
}
```

### React
```javascript
// index.jsx
import { initFeedback, FeedbackErrorBoundary } from 'platform-feedback'
import { FeedbackButton } from 'platform-feedback/components'
initFeedback()

root.render(
  <FeedbackErrorBoundary>
    <App />
    <FeedbackButton user={currentUser} />
  </FeedbackErrorBoundary>
)
```

### Vue 3
```javascript
// main.js
import { PlatformFeedbackPlugin } from 'platform-feedback'
app.use(PlatformFeedbackPlugin)
```

```html
<!-- App.vue -->
<template>
  <RouterView />
  <FeedbackButton :user="currentUser" />
</template>
<script setup>
import FeedbackButton from 'platform-feedback/components/FeedbackButton.vue'
</script>
```

### Angular 17+
```typescript
// app.module.ts or main.ts
import { PlatformFeedbackModule } from 'platform-feedback'
PlatformFeedbackModule.forRoot()

// Any component template:
// <pf-feedback-button [user]="currentUser" />
```

### Express
```javascript
import { initExpress } from 'platform-feedback'
// Must be called AFTER all routes are defined
initExpress(app)
```

---

## Adding a New Product

1. Set 5 env vars in the microservice
2. Install the SDK (one line)
3. Call `init_feedback(app)` or `initFeedback()`
4. Done

No feedback logic lives in the microservice.

---

## Development

### Branch workflow

1. **`dev`** — all development happens here
2. **PR to `main`** — CI runs lint, tests, and security checks; requires 1 approving review
3. **Merge to `main`** — CI publishes `js-dist` and `python-dist` branches automatically
4. Consumer apps install from the dist branches (see Install above)

### Setup

After cloning, install dependencies and the pre-push hook:

```bash
# Python
cd python && python -m venv .venv && .venv/bin/pip install -e ".[test]" && .venv/bin/pip install ruff

# JS
cd js && npm install

# Git hooks
./scripts/setup-hooks.sh
```

The pre-push hook runs ruff, eslint, pytest, and vitest before every push to `dev` or `main`.
Skip with `git push --no-verify` if needed.

### CI

Runs automatically on push to `dev` and PR to `main`:

| Check | Tool | What it does |
|-------|------|-------------|
| Python lint | ruff | Import sorting, unused imports, formatting |
| Python tests | pytest | Unit tests for core modules |
| Python security | pip-audit | Known vulnerabilities in dependencies |
| JS lint | eslint | Code quality checks |
| JS tests | vitest | Unit tests for core modules |
| JS security | npm audit | Known vulnerabilities in dependencies |

### Branch protection

- **`main`** — requires PR, 1 review, all CI checks passing; force pushes blocked
- **`js-dist` / `python-dist`** — CI-managed, deletion protected
