# 02 Developer Guide and Agents

> Consolidated documentation chapter for **frontend**

---

## Source: $relSource

# RoomBae Developer Guide

## 1. Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Build Verification
```bash
cd frontend
npm run build
```

### Backend Setup
```bash
cd backend
npm install
npm run build
```

---

## 2. Coding Guidelines

1. **Path Aliases**: Always use standardized path aliases (e.g. `@features/residents`, `@components/ui/Button`, `@services/auth.service`) instead of relative paths (`../../../../`).
2. **Domain Isolation**: Place feature-specific UI, pages, and hooks inside `src/features/[domain]/`.
3. **State Management**:
   - Use **Zustand** (`@store/useUIStore`) for global UI drawer/modal toggles.
   - Use **Apollo Client / React Query** for server state.
   - Use **Context** only for global scope tree values (e.g., `ThemeProvider`, `NavigationProvider`).
4. **Form Validation**: Define Zod schemas in `@schemas/` and infer TypeScript types using `z.infer<typeof schema>`.
5. **Route Access**: Protect routes using `@guards/RouteGuard`, `@guards/RoleGuard`, or `@guards/PermissionGuard`.



---

## Source: $relSource

# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **always running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Key Files

- `src/App.tsx` - Main application component
- `src/main.tsx` - React entry point
- `src/index.css` - Global styles and Tailwind CSS import
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `.mise.toml` - Toolchain versions (Node.js, pnpm)

## Styling

This project uses **Tailwind CSS v4** for styling. Use Tailwind utility classes directly in JSX. Tailwind is loaded via the Vite plugin — no PostCSS config needed.



---

## Source: $relSource

# Security Policy

## Supported Versions

We release security fixes for the latest major version of the PG Management System. Older versions are not guaranteed to receive patches.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do not open a public GitHub issue.** Public disclosure before a fix is available can put live tenants' data at risk.

Instead, report it privately using one of the following channels:

- **GitHub Private Vulnerability Reporting:** Go to the [Security tab](../../security/advisories) of this repository and click "Report a vulnerability."
- **Email:** security@\<your-domain\>.com (replace with your actual contact before publishing)

Please include as much of the following as you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce, or a proof-of-concept if available
- Affected component/module (e.g., Identity, Billing, Tenancy)
- Any suggested remediation, if you have one

## What to Expect

- **Acknowledgment:** within 48 hours of your report
- **Initial assessment:** within 5 business days, including severity classification
- **Fix timeline:** critical issues (auth bypass, tenant data leakage, payment integrity) are prioritized for immediate patching; we aim to ship a fix or mitigation within 14 days of confirmation
- **Disclosure:** we'll coordinate with you on a disclosure timeline once a fix is released. Credit is given to reporters who wish to be acknowledged.

## Scope

In scope:
- The Node.js + Express backend (Identity, Property, Tenancy, Billing, Operations, Notification, Analytics modules)
- The React + Vite dashboard and public marketing/discovery site
- Multi-tenant data isolation (Prisma scoping, MongoDB `ownerId` filters)
- Authentication and session handling (Google OAuth2, JWT, Passport.js)
- Payment integration flows (Razorpay/Stripe)

Out of scope:
- Third-party services we integrate with (Razorpay, Stripe, WhatsApp Business API) — report those directly to the respective vendor
- Denial-of-service via brute-force volume without a demonstrated exploit
- Issues requiring physical access to a user's device

## Security Practices

For context on existing protections, see the [Security section of the README](README.md#security) — this includes TLS 1.3/HSTS, Google OAuth2, JWT verification, field-level encryption for sensitive data, Prisma ORM query isolation, and automated dependency/vulnerability scanning in CI.

Thank you for helping keep the PG Management System and its users' data safe.


---

## Source: $relSource

---
name: pg
description: Describe what this custom agent does and when to use it.
tools: Read, Grep, Glob, Bash # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

<!-- Tip: Use /create-agent in chat to generate content with agent assistance -->

Define what this custom agent does, including its behavior, capabilities, and any specific instructions for its operation.


---

