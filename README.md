# platform-feedback

Single-import feedback SDK for all platform microservices.
Auto-detects framework. Zero config beyond 5 env vars.

## Repos

```
platform-feedback/
    python/   ← pip install (FastAPI, Starlette, Django, Flask, Streamlit, Headless)
    js/       ← npm install (Next.js, React, Vue 3, Angular 17+, Express, Browser)
```

## Required Env Vars (all frameworks, identical names)

```env
FEEDBACK_SERVICE_URL=https://feedback.yourplatform.com
FEEDBACK_API_KEY=your-secret-key
FEEDBACK_APP_NAME=vetceedr
FEEDBACK_MICROSERVICE=backend        # or frontend, auth, api, etc.
FEEDBACK_ENV=staging                 # staging | production
```

## Python — Install

```bash
pip install git+https://github.com/your-org/platform-feedback.git#subdirectory=python
```

## JS — Install

```bash
npm install github:your-org/platform-feedback#path=js
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
