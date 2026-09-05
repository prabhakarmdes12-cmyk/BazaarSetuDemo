# Chiti Bazaar &mdash; Agent Development Guide

## Mission & Architectural Invariants

1. **Blinkit Visual Benchmark**: The customer storefront (`/customer`) must always deliver instant, mouth-watering visual appeal equal to or exceeding Blinkit and Zepto. Never regress to empty store lists or missing product shelves.
2. **Zero-Config Deployment**: All changes are automatically built and deployed via git pushes to `https://github.com/prabhakarmdes12-cmyk/chiti-bazaar.git` on `main` and `production`. Never require the user to configure Vercel or DNS manually.
3. **Preserve Passing Tests**: All 55 backend tests (`npm test` in `backend/`) must remain 100% passing.
4. **Unicode Cleanliness**: Always use standard UTF-8 characters:
   - Indian Rupee: `₹` (never `,1`)
   - Minus sign: `−` (never `^'`)
   - Lightning bolt: `⚡` (never `s`)
   - Bullet separator: `&bull;` or `·` (never `?`)
5. **Next.js Image Optimization**: `next.config.js` is set to `images.unoptimized: true` to allow seamless remote CDN grocery photos from Unsplash, Wikimedia, and user uploads.

---

## Key Workflows for Agents

### 1. Verifying Builds
```bash
# Run production build to ensure all 32 routes compile cleanly
cd frontend
npm run build
```

### 2. Testing Frontend Dev Server
```bash
# Local dev server runs on port 3005
cd frontend
npm run dev -- -p 3005
# Verify http://localhost:3005/customer returns 200 OK
```

### 3. Deploying Changes
```bash
git add <modified-files>
git commit -m "feat(scope): concise description"
git push chiti-bazaar main
git push chiti-bazaar main:production
```
