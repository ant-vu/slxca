SLXCA — Academic → Industry matching (prototype)

## Overview

SLXCA is a small static prototype demonstrating a Canada-focused platform where academics can publish papers/ideas and entrepreneurs, engineers, and specialists can discover and join projects that leverage Canadian strategic advantages (e.g., nuclear, cheap energy, methane, land & lumber, data centres).

This prototype is intentionally client-only (plain HTML/CSS/JS) and stores demo data in the browser `localStorage` so you can evaluate UX and flows without a backend.

Features in this prototype

- Submit a paper / idea (title, authors, institution, abstract, strategic advantages)
- Submit a paper / idea (title, authors, institution, abstract, strategic advantages, stage)
- Browse and filter projects (entrepreneur/executor POV at `projects.html`)
- Create a simple role profile (role preference, skills) and view quick matches
- Join a project (adds you to the project's joiners)
- Demo seed that populates sample projects, roles, and courses

## Files

- `index.html` — Main app: paper submission, browse, profile, matches, and courses.
- `projects.html` — Entrepreneur / executor view: filter and browse projects.
- `styles.css` — Styling for the prototype (dark theme).
- Theme toggle — a persistent animated light/dark toggle is available in the header (stored in localStorage).
- `app.js` — Client-side logic, storage (uses `localStorage`), and demo seed.
- `README.md` — This file.
- `NOTES.md` — Additional project notes and quickstart.

## How to run (quick)

1. Open the folder in Finder or a terminal.
2. Double-click `index.html` or run:

```bash
open index.html
```

3. In the app footer click `Seed demo data` to populate example projects and courses (you'll be asked before overwriting existing local data).
4. Visit `projects.html` (link in the header) to view the entrepreneur POV with filters.

## Data model (localStorage)

- `canproj_projects` — Array of project objects: { id, title, authors, institution, abstract, advantages: [], joiners: [] }
- `canproj_projects` — Array of project objects: { id, title, authors, institution, abstract, advantages: [], stage, joiners: [] }
- `canproj_profile` — Single saved profile object: { name, email, role, skills: [], affiliation?, courses: [] }
- `canproj_courses` — Array of available course objects: { id, title, provider, duration }

## Developer notes

- The app exposes a small API on `window._canapp` to help manual testing: `seedDemo()`, `renderProjectsFiltered()`, `loadProjects()`, `loadProfile()`, `loadCourses()`.
- `seedDemo()` will write demo projects (IDs prefixed with `p_demo_`) and demo courses. It also populates an in-memory `window._canapp_roles` array used to populate the role dropdown.

## Design & matching algorithm

- Matching is intentionally lightweight for the prototype: it calculates a score by matching user skills against project text (title/abstract/advantages). Each matching skill adds points, and role/affiliation matches add smaller bonuses.

## Limitations & next steps

- No authentication — anyone running the page can seed data and edit local storage.
- `localStorage` is not multi-user or persistent across devices. Add a backend (Node/Express + database) for production.
- Personality test — expand to a psychometric quiz with trait vectors and more nuanced matching.
- Messaging and legal workflows — add private messaging, NDA, IP assignment, and milestone tracking for real project execution.

## Ideas for production

- Server-side: auth with university email verification, a REST API to manage projects, users, roles, and notifications.
- Matching: use trait vectors, role skills mapping, and allow manual project needs specification (phase, funding, team slots).
- Discovery: add feeds, newsletters, and integrations with grant/funding platforms.

## Contact / where to start next

If you'd like, I can:

- Expand the personality/profile flow (client-only) with 8–12 questions and trait vector matching.
- Scaffold a minimal backend (Node/Express + SQLite) to persist projects and support basic authentication.
- Add richer project metadata and filters (stage, funding, required roles).
- Add richer project metadata and filters (stage, funding, required roles).

Pick a next step and I'll update the plan and implement it.
