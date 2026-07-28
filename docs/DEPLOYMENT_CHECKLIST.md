# Deployment Checklist

**Project**: RoomBae PG Management System  
**Target Platform**: GitHub Pages (via GitHub Actions)  
**Repository**: `ayushman-glb/PG-Management-System`  
**Status**: **DEPLOYMENT READY**

---

## 1. GitHub Actions CI/CD Readiness

- [x] **Workflow File Location**: Verified at `.github/workflows/deploy.yml` (plural directory).
- [x] **Branch Trigger**: Configured to run on push to `main` and `workflow_dispatch`.
- [x] **Node Version**: Set to `20` with `npm` dependency caching.
- [x] **Install Step**: Uses `npm ci` matching `package-lock.json`.
- [x] **Build Step**: Executes `npm run build` (`tsc -b && vite build`).
- [x] **Pages Artifact Upload**: Uploads `./dist` using `actions/upload-pages-artifact@v3`.
- [x] **Deployment Step**: Deploys via `actions/deploy-pages@v4`.
- [x] **Permissions**: Explicit `contents: read`, `pages: write`, `id-token: write`.

---

## 2. GitHub Repository Settings Checklist

Before pushing your changes to GitHub, ensure the following repository settings are enabled:

1. **Navigate to Repository Settings**:
   - Go to your repository on GitHub: `https://github.com/ayushman-glb/PG-Management-System/settings`.
2. **Configure Pages Build and Deployment Source**:
   - Under the **Pages** menu (in the left sidebar under Code and automation).
   - Change **Source** to **GitHub Actions** (instead of Deploy from a branch).
3. **Trigger Deployment**:
   - Push your code to the `main` branch, or manually trigger the workflow under the **Actions** tab on GitHub!

---

## 3. Static Hosting Compatibility Checklist

- [x] **Vite Base Path**: Configured as `/PG-Management-System/` in `vite.config.ts`.
- [x] **Static Assets**: Moved to `public/images/` and verified inside `dist/images/`.
- [x] **Bundled Images**: `src/App.tsx` imports `loading.png` module asset for automatic base URL injection.
- [x] **Jekyll Bypass**: `public/.nojekyll` present.
- [x] **SPA 404 Route Fallback**: `public/404.html` present.

---

## 4. Verification Commands

To test your deployment locally before pushing:

```bash
# 1. Clean install dependencies
npm ci

# 2. Run full production build (TypeScript check + Vite build)
npm run build

# 3. Preview built production bundle locally
npm run preview
```
