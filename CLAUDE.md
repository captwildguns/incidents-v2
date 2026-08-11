# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IncidentsV2** — the V2 test fork of the Student Transportation Incident Tracker prototype. React + Vite + Tailwind CSS. It simulates an incident management system for school transportation (Tyler Technologies / Traversa branding). All data is hardcoded (no backend/API).

This project exists to rework how incidents get created without disturbing the current site. Big changes land here first.

- V2 test site (this project): `https://captwildguns.github.io/incidents-v2/` from repo `captwildguns/incidents-v2`
- Current site (leave working): `https://captwildguns.github.io/incident-tracker/` from repo `captwildguns/incident-tracker`

Forked from `captwildguns/incident-tracker` at commit `bc86d3e`, so full history before that point is shared. The two repos are independent from that commit forward; nothing syncs automatically between them.

Figma source: `https://www.figma.com/design/mL9xFgEtvUvEGvMCbkV9c9/Incident-tracker---Ted-Final-version`

The app source lives in `Figma files/` subdirectory (not the repo root).

The Vite `base` here is `/incidents-v2/`. Do not copy it back to the original project.

## Commands

```bash
# All commands must be run from the "Figma files" directory
cd "Figma files"

# Install dependencies
npm install

# Local dev server (port 3000, auto-opens browser)
npm run dev

# Production build (outputs to build/)
npm run build

# Deploy to Vercel (requires vercel login first)
npx vercel --yes
```

**Note on Windows/Git Bash:** Node.js may not be on PATH by default. Use:
```bash
export PATH="/c/Program Files/nodejs:/c/Users/Gabe.guzman/AppData/Roaming/npm:$PATH"
```

## Architecture

### Tech Stack
- **React 18** (client-side SPA, no router — state-based page switching)
- **Vite 6** with `@vitejs/plugin-react`
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin
- **Radix UI** primitives (shadcn/ui pattern) for all UI components
- **Recharts** for dashboard charts
- **Lucide React** for icons

### Routing
There is no React Router. Navigation is handled via `useState('dashboard')` in `App.tsx` with a `renderPage()` switch statement. The `navigateToPage` callback is passed as props through the component tree.

### Key Directories (under `Figma files/src/`)
- `components/layout/` — AppLayout (header, nav tabs, slideout menu, footer)
- `components/ui/` — shadcn/ui component library (do not edit directly unless needed)
- `components/incidents/` — Core feature: incident list, detail, forms, workflow progress
- `components/workflows/` — Workflow builder and management
- `components/dashboard/` — Dashboard with charts and summary cards
- `data/` — Hardcoded data (workflows, email templates)
- `styles/globals.css` — Design tokens and CSS custom properties
- `assets/` — Figma-exported PNG images (hashed filenames)

### Design System
Implements **Tyler Forge 3.x** design tokens defined in `src/styles/globals.css`:
- Brand colors: deep blues (`--brand-blue-dark: #4A6FA5`) and olives (`--brand-olive-dark: #7B8458`)
- Font: Roboto 400/500
- Base font size: 14px (`--text-base`)
- Spacing: `--forge-spacing-*` tokens (xxsmall=4px through xxlarge=48px)
- Elevation: `--forge-elevation-*` tokens (1 through 24)

### Vite Config
`vite.config.ts` has extensive `resolve.alias` entries mapping versioned package imports (from Figma Make export) and `figma:asset/*` paths to local files. The `@` alias points to `src/`.

### Pages
Dashboard, Incidents (list + detail), Students, Drivers, Vehicles, Communications, Reports, Workflows (list + builder), Admin, Help, New Incident Form.

## Deployment
Currently deployed via Vercel CLI (`npx vercel`). The build output directory is `build/`.
