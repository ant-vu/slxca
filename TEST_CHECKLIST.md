SLXCA — Manual end-to-end test checklist

Purpose: quick manual verification of key flows (paper submission, editing, filtering, profile, personality, join/offer, import/export, demo seed).

Prerequisites

- Use a modern browser (Chrome, Edge, Safari, Firefox).
- Open the project folder and open `index.html` in the browser (or run `open index.html` on macOS).

Checklist

1. Seed demo data

- Action: On `index.html` (main app) open the page and click “Seed demo data” (if present in footer or UI).
- Expected: Demo projects, roles and courses are populated. Browse Projects shows several entries.

2. Submit a new paper (happy path)

- Action: Fill Title, Authors, Institution, pick 1–3 chips under Strategic advantage, choose a Stage, write a short Abstract, optional traits; click “Submit Paper”.
- Expected: New project appears at top of Browse Projects list. Owner info shows your saved profile (if you had a profile saved). Created/Updated timestamps present.

3. Edit a project

- Action: Save a profile with an email. Create a project (it will attach ownerEmail). Refresh the page. As the owner, click Edit on your project, change the Stage or Abstract, click Submit.
- Expected: Project updates in the list and updatedAt timestamp changes. Cancel Edit hides edit UI.

4. Delete a project

- Action: As the project owner click Delete.
- Expected: Confirm prompt appears. After confirming, project is removed from the list.

5. Profile save and match

- Action: Complete the Profile form (name, email, role, skills) and click Save Profile.
- Expected: Profile persists in localStorage; matching panel shows top matching projects.

6. Personality survey and trait visualization

- Action: Answer the short personality survey and click Save Personality.
- Expected: Trait summary bars and radar update in the Role Profile area. Matches should consider trait similarity if present.

7. Join a project

- Action: Open a project and click “Join / Offer help”.
- Expected: If profile exists, you get added as a joiner. Project details and card list your name in Joiners.

8. Projects / Projects.html filters

- Action: Go to `projects.html`. Use Filter advantage, Stage, and Search inputs. Clear filters.
- Expected: The list updates to reflect filters. Clearing returns to the full list.

9. Export / Import

- Action: Click Export Data to download a JSON export. Then click Import Data and choose the file; try both Overwrite and Merge flows.
- Expected: Exported JSON has `projects`, `profile`, `courses`. Import Preview shows counts. Overwrite replaces local data; Merge appends projects.

10. Test regeneration/reset

- Action: Clear localStorage for the page (browser devtools Application tab → Local Storage → clear). Reload. Run Seed Demo.
- Expected: Seed restores the demo projects and courses.

Notes / Edge cases to try

- Try submitting without a Title — the form should block submission (Title is required).
- Try uploading an invalid JSON file to Import — you should see an error.
- Try the personality form with partial answers — trait values compute from answered questions only.

If anything fails

- Capture screenshots and console logs (DevTools) and paste them into an issue with steps to reproduce.
- If localStorage is corrupted, clear it and seed demo again.
