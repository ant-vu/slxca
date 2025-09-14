CanInnovate — Prototype (Static HTML/CSS/JS)

What this is

- A minimal static prototype demonstrating a Canadian-focused academic-to-industry platform.
- Implemented using only HTML, CSS, and JavaScript. Data is stored locally in the browser `localStorage`.

Files

- `index.html` — Main UI: submit papers, browse projects, profile, matching, and courses.
- `styles.css` — Simple dark theme styles.
- `app.js` — All interactive behavior and storage.

How to run

1. Open `index.html` in a browser (double-click or `open index.html` on macOS).
2. Submit a paper in the "Submit a Paper / Idea" section.
3. Save a profile in the "Personality / Role Profile" section and then use "Join" on projects to simulate matching.
4. Courses can be enrolled after saving a profile.

Edge cases covered

- Data persistence: uses `localStorage` (clearing browser data will reset it).
- Basic form validation: required name/title for profiles/papers.
- Prevents duplicate joiners by email.

Next steps (suggested)

- Add server-side storage and authentication (university/organization email verification).
- Expand the personality test with validated psychometrics and better matching.
- Add project phases, milestones, and payment/legal scaffolding.

Notes

This is a prototype scaffold intended for early-stage demos. It is intentionally offline and client-only to make it easy to try out ideas quickly.
