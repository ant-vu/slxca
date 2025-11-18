# NOTES — SLXCA Prototype

This repository is a small client-only prototype for matching academics and industry participants in Canada. It demonstrates basic flows for submitting papers/ideas, creating a simple role profile, browsing projects, and joining projects, all stored in the browser `localStorage`.

## Quick links

- `index.html` — Main app UI (submit, profile, matches, courses)
- `projects.html` — Entrepreneur / executor view (filters)
- `app.js` — Client logic and demo seed

## Purpose

- Provide a lightweight UX to explore academic → industry collaboration flows.
- Validate matching heuristics without a backend.

## How to try

1. Open `index.html` in a browser (`open index.html`).
2. In the app footer, click `Seed demo data` to populate example projects and courses.
3. Use `projects.html` to explore filtering and join flows.

## Developer notes

- Demo data and application state are stored in `localStorage` keys: `canproj_projects`, `canproj_profile`, `canproj_courses`.
- Useful helpers available on `window._canapp`: `seedDemo()`, `loadProjects()`, `renderProjectsFiltered()`.

## Suggested next steps

- Add a minimal backend (Node/Express + SQLite) for persistence and real multi-user behavior.
- Improve matching algorithm: trait vectors and role/skill mapping.
- Add authentication, messaging, and legal workflows for production readiness.

If you'd like, I can implement any of the suggested next steps — tell me which one and I'll update the plan.
