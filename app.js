// Simple static prototype app.js — stores data in localStorage
const LS_KEYS = {
  PROJECTS: "canproj_projects",
  PROFILE: "canproj_profile",
  COURSES: "canproj_courses",
  FILTERS: "canproj_filters",
};

// Utilities
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Initial sample courses
const SAMPLE_COURSES = [
  {
    id: "c1",
    title: "Intro to Canadian Tech Entrepreneurship",
    provider: "CanInnovate",
    duration: "3 weeks",
  },
  {
    id: "c2",
    title: "Energy Systems & Policy (Canada)",
    provider: "UofT x Industry",
    duration: "6 weeks",
  },
  {
    id: "c3",
    title: "Scaling Data Centres in Cold Climates",
    provider: "Industry Lab",
    duration: "2 weeks",
  },
];

// Mock roles and demo projects (for seeding)
const DEMO_ROLES = [
  "Entrepreneur / Founder",
  "Engineer / Technical Lead",
  "Product Manager",
  "Researcher / Academic",
  "Specialist / Advisor",
  "Data Centre Ops",
  "Nuclear Systems Engineer",
];

const DEMO_PROJECTS = [
  {
    title: "Cold-Climate Data Centre Placement using Cheap Hydro",
    authors: "A. Singh (UofT)",
    institution: "University of Toronto",
    abstract:
      "Optimizing placement of data centres in regions with abundant cheap hydro power to reduce cooling costs and carbon footprint.",
    advantages: ["Cheap Energy", "Data Centres"],
    stage: "Research",
  },
  {
    title: "Methane Capture for Grid Stability",
    authors: "L. Chen (McGill)",
    institution: "McGill University",
    abstract:
      "Novel catalytic approach to capture and convert methane emissions into dispatchable energy.",
    advantages: ["Methane", "Resources"],
    stage: "Prototype",
  },
  {
    title: "Nuclear Microreactors for Distributed Compute",
    authors: "R. Patel (UofT)",
    institution: "University of Toronto",
    abstract:
      "Design and safety models for small modular reactors powering edge data centres.",
    advantages: ["Nuclear", "Cheap Energy", "AI / Compute"],
    stage: "Idea",
  },
  {
    title: "Sustainable Lumber Supply Chains",
    authors: "M. Osei (UBC)",
    institution: "University of British Columbia",
    abstract:
      "Blockchain-backed traceability for lumber supply to support sustainable construction.",
    advantages: ["Land & Lumber", "Resources"],
    stage: "Prototype",
  },
];

/**
 * Read a JSON value from localStorage by key.
 * Returns the parsed value or null on error / missing key.
 * @param {string} key
 * @returns {any|null}
 */
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || null;
  } catch (e) {
    return null;
  }
}
/**
 * Restore any persisted UI filter state from localStorage into the page.
 * This was previously embedded (accidentally) inside `read()` and thus
 * was unreachable. Extracting it here clarifies intent and allows
 * initialization to explicitly call the restore step.
 */
function restoreFiltersFromStorage() {
  try {
    const savedFilters = loadFiltersState() || {};
    if (savedFilters) {
      // restore search text
      const qsEl = document.getElementById("quick-search");
      if (qsEl && typeof savedFilters.text === "string")
        qsEl.value = savedFilters.text;
      // restore adv match mode
      const modeEl = document.getElementById("adv-match-mode");
      if (modeEl && savedFilters.advMatchMode)
        modeEl.value = savedFilters.advMatchMode;
      // clear existing chip actives
      document
        .querySelectorAll(".quick-chip.active")
        .forEach((c) => c.classList.remove("active"));
      // restore stage chip
      if (savedFilters.stage) {
        const stageChip = document.querySelector(
          '.quick-chip[data-stage="' + savedFilters.stage + '"]'
        );
        if (stageChip) stageChip.classList.add("active");
      }
      // restore favorites chip
      if (savedFilters.favorites) {
        const favChip = document.querySelector(".quick-chip[data-fav]");
        if (favChip) favChip.classList.add("active");
      }
      // restore advantage chips
      if (Array.isArray(savedFilters.advantages)) {
        savedFilters.advantages.forEach((a) => {
          const chip = document.querySelector(
            '.quick-chip[data-adv="' + a + '"]'
          );
          if (chip) chip.classList.add("active");
        });
      }
      // trigger initial filtered render using restored state
      renderProjectsFiltered({
        text: (savedFilters.text || "").trim(),
        stage: savedFilters.stage || "",
        advantages: savedFilters.advantages || [],
        advMatchMode: savedFilters.advMatchMode || "any",
        favorites: !!savedFilters.favorites,
      });
    }
  } catch (e) {
    // ignore any restore errors — do not block normal startup
  }
}
/**
 * Write a value to localStorage as JSON.
 * This is a small wrapper to centralize JSON serialization.
 * @param {string} key
 * @param {any} v

 * - If no id exists, a new id and timestamps are created.
 * After saving, the UI is re-rendered.
 * @param {Object} proj
 */
function saveProject(proj) {
  const ps = loadProjects();
  if (proj.id) {
    // update existing
    const idx = ps.findIndex((x) => x.id === proj.id);
    if (idx >= 0) {
      // preserve joiners if not provided
      proj.joiners = proj.joiners || ps[idx].joiners || [];
      // preserve owner info if not provided
      proj.ownerEmail = proj.ownerEmail || ps[idx].ownerEmail;
      proj.ownerName = proj.ownerName || ps[idx].ownerName;
      // preserve favorite flag when editing if not provided in form
      if (typeof proj.favorite === "undefined")
        proj.favorite = ps[idx].favorite;
      ps[idx] = proj;
    } else {
      ps.unshift(proj);
    }
  } else {
    proj.id = "p" + Date.now();
    const now = new Date().toISOString();
    proj.createdAt = now;
    proj.updatedAt = now;
    proj.joiners = proj.joiners || [];
    ps.unshift(proj);
  }
  // ensure updatedAt is set on update
  if (proj.id && !proj.createdAt) {
    // if createdAt missing (older item), attempt to preserve from existing
    const existing = ps.find((x) => x.id === proj.id);
    if (existing && existing.createdAt) proj.createdAt = existing.createdAt;
  }
  // always set updatedAt to now for save/update
  proj.updatedAt = new Date().toISOString();
  write(LS_KEYS.PROJECTS, ps);
  renderProjects();
}

/**
 * Delete a project by id (with a confirmation prompt).
 * @param {string} id
 */
function deleteProject(id) {
  if (!confirm("Delete this project? This cannot be undone.")) return;
  const ps = loadProjects();
  const out = ps.filter((p) => p.id !== id);
  write(LS_KEYS.PROJECTS, out);
  renderProjects();
}

/**
 * Prefill the project edit form for the project with the provided id.
 * Scrolls to top and reveals the cancel edit control.
 * @param {string} id
 */
function editProject(id) {
  const ps = loadProjects();
  const p = ps.find((x) => x.id === id);
  if (!p) return;
  // prefill form
  $("#paper-title").value = p.title || "";
  $("#paper-authors").value = p.authors || "";
  $("#paper-institution").value = p.institution || "";
  $("#paper-abstract").value = p.abstract || "";
  $$("#advantage-chips .chip").forEach((c) => c.classList.remove("active"));
  (p.advantages || []).forEach((a) => {
    const chip = Array.from($$("#advantage-chips .chip")).find(
      (c) => c.textContent === a
    );
    if (chip) chip.classList.add("active");
  });
  // fill project trait selects if present
  if (p.traits) {
    Object.keys(p.traits).forEach((k) => {
      const el = $("#proj-trait-" + k);
      if (el) el.value = p.traits[k];
    });
  }
  // prefill stage if present
  if (p.stage) {
    const stageEl = $("#paper-stage");
    if (stageEl) stageEl.value = p.stage;
  }
  $("#edit-project-id").value = p.id;
  const cancel = $("#cancel-edit");
  if (cancel) cancel.style.display = "inline-block";
  // scroll to top so user sees the form
  window.scrollTo({ top: 0, behavior: "smooth" });
}
/**
 * Add a joiner (profile) to a project. Returns true if the profile
 * was added (or was already present).
 * Persists the change and triggers a UI refresh.
 * @param {string} projectId
 * @param {Object} profile - { name, email, ... }
 * @returns {boolean}
 */
function joinProject(projectId, profile) {
  const ps = loadProjects();
  const p = ps.find((x) => x.id === projectId);
  if (!p) return false;
  p.joiners = p.joiners || [];
  if (!p.joiners.find((j) => j.email === profile.email))
    p.joiners.push(profile);
  write(LS_KEYS.PROJECTS, ps);
  renderProjects();
  return true;
}

// owner-facing helper: remove a joiner (by email) from a project
/**
 * Owner-facing helper: remove a joiner (by email) from a project.
 * Prompts for confirmation, persists change, refreshes UI and any open modal.
 * @param {string} projectId
 * @param {string} email
 * @returns {boolean}
 */
function removeJoiner(projectId, email) {
  if (!confirm("Remove this joiner from project?")) return false;
  const ps = loadProjects();
  const p = ps.find((x) => x.id === projectId);
  if (!p) return false;
  p.joiners = (p.joiners || []).filter((j) => j.email !== email);
  write(LS_KEYS.PROJECTS, ps);
  renderProjects();
  // if project details modal for this project is open, refresh it
  const existingModal = document.querySelector(".canapp-project-modal");
  if (
    existingModal &&
    existingModal.getAttribute("data-project-id") === projectId
  ) {
    try {
      const updated = ps.find((x) => x.id === projectId);
      document.body.removeChild(existingModal);
      showProjectDetails(updated);
    } catch (e) {}
  }
  showToast("Joiner removed");
  return true;
}

// Profile
/**
 * Load the saved user profile from localStorage.
 * Returns null when no profile exists.
 * @returns {Object|null}
 */
function loadProfile() {
  let pf = read(LS_KEYS.PROFILE);
  if (!pf) {
    pf = null;
  }
  return pf;
}

/**
 * Persist the user's profile and refresh profile UI.
 * @param {Object} pf
 */
function saveProfile(pf) {
  write(LS_KEYS.PROFILE, pf);
  renderProfile();
}

/**
 * Clear the saved profile and update the UI.
 */
function clearProfile() {
  localStorage.removeItem(LS_KEYS.PROFILE);
  renderProfile();
}

// Courses
/**
 * Load persisted courses list (seeds sample courses on first run).
 * @returns {Array<Object>}
 */
function loadCourses() {
  let c = read(LS_KEYS.COURSES);
  if (!c) {
    c = SAMPLE_COURSES;
    write(LS_KEYS.COURSES, c);
  }
  return c;
}

/**
 * Enroll the current profile in a course by id. Requires a saved profile.
 * Provides simple UX alerts on success/failure and persists the profile.
 * @param {string} id
 */
function enrollCourse(id) {
  const c = loadCourses();
  const course = c.find((x) => x.id === id);
  if (!course) return;
  const pf = loadProfile();
  if (!pf) {
    alert("Save a profile before enrolling.");
    return;
  }
  pf.courses = pf.courses || [];
  if (!pf.courses.includes(id)) pf.courses.push(id);
  saveProfile(pf);
  alert("Enrolled: " + course.title);
}

// Renderers
function renderProjects() {
  // Delegate to filtered renderer with empty filter (renders all)
  renderProjectsFiltered({});
}

/**
 * Render the personality questionnaire UI based on the QUESTIONS constant.
 * This function will pre-fill any answers stored in the user's profile.
 */
function renderPersonalityQuestions() {
  const container = $("#questions");
  if (!container) return;
  container.innerHTML = "";
  const pf = loadProfile();
  QUESTIONS.forEach((q) => {
    const div = document.createElement("div");
    div.className = "question";
    const t = document.createElement("div");
    t.className = "qtext";
    t.textContent = q.text;
    div.appendChild(t);
    const likert = document.createElement("div");
    likert.className = "likert";
    for (let i = 1; i <= 5; i++) {
      const id = q.id + "_" + i;
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.value = i;
      input.id = id;
      const span = document.createElement("span");
      span.textContent = i;
      label.appendChild(input);
      label.appendChild(span);
      likert.appendChild(label);
    }
    div.appendChild(likert);
    container.appendChild(div);
  });
  // pre-fill if profile has per-question answers saved
  if (pf && pf.personalityAnswers) {
    QUESTIONS.forEach((q) => {
      const val = pf.personalityAnswers[q.id];
      if (val) {
        const el = document.querySelector(
          'input[name="' + q.id + '"][value="' + val + '"]'
        );
        if (el) el.checked = true;
      }
    });
  }
}

// Personality test questions (map to trait axes)
// Expanded to 12 questions for improved reliability (some traits repeated)
const QUESTIONS = [
  {
    id: "q1",
    text: "I prefer to lead new initiatives and take charge of projects.",
    trait: "drive",
  },
  {
    id: "q2",
    text: "I enjoy working closely with diverse teams and collaborators.",
    trait: "collaboration",
  },
  {
    id: "q3",
    text: "I am comfortable with technical complexity and low-level systems work.",
    trait: "technical",
  },
  {
    id: "q4",
    text: "I prefer stable, low-risk approaches over experimental ones.",
    trait: "risk_aversion",
  },
  {
    id: "q5",
    text: "I like to move quickly and iterate rather than plan every detail.",
    trait: "speed",
  },
  {
    id: "q6",
    text: "I pay attention to regulatory, safety, and compliance details.",
    trait: "compliance",
  },
  {
    id: "q7",
    text: "I enjoy designing systems for scale (e.g., data centres, infrastructure).",
    trait: "scale",
  },
  {
    id: "q8",
    text: "I prefer working on long-term research rather than immediate product delivery.",
    trait: "long_term",
  },
  {
    id: "q9",
    text: "I often take initiative to push projects past obstacles.",
    trait: "drive",
  },
  {
    id: "q10",
    text: "I actively seek input from others and value diverse perspectives.",
    trait: "collaboration",
  },
  {
    id: "q11",
    text: "I enjoy debugging and solving low-level technical problems.",
    trait: "technical",
  },
  {
    id: "q12",
    text: "I prefer rapid prototyping and testing ideas quickly.",
    trait: "speed",
  },
];

function renderPersonalityQuestions() {
  const container = $("#questions");
  if (!container) return;
  container.innerHTML = "";
  const pf = loadProfile();
  QUESTIONS.forEach((q) => {
    const div = document.createElement("div");
    div.className = "question";
    const t = document.createElement("div");
    t.className = "qtext";
    t.textContent = q.text;
    div.appendChild(t);
    const likert = document.createElement("div");
    likert.className = "likert";
    for (let i = 1; i <= 5; i++) {
      const id = q.id + "_" + i;
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.value = i;
      input.id = id;
      const span = document.createElement("span");
      span.textContent = i;
      label.appendChild(input);
      label.appendChild(span);
      likert.appendChild(label);
    }
    div.appendChild(likert);
    container.appendChild(div);
  });
  // pre-fill if profile has per-question answers saved
  if (pf && pf.personalityAnswers) {
    QUESTIONS.forEach((q) => {
      const val = pf.personalityAnswers[q.id];
      if (val) {
        const el = document.querySelector(
          'input[name="' + q.id + '"][value="' + val + '"]'
        );
        if (el) el.checked = true;
      }
    });
  }
}

/**
 * Collect personality questionnaire answers from the DOM, aggregate
 * them by trait, and return both raw per-question answers and
 * per-trait averages (and normalized 0..1 values).
 * Returns null when no answers were provided.
 * @returns {{answersByQ: Object, traitAverages: Object, traitNormalized: Object}|null}
 */
function collectPersonalityAnswers() {
  // collect per-question answers and aggregate per-trait
  const answersByQ = {};
  const sums = {};
  const counts = {};
  let any = false;
  QUESTIONS.forEach((q) => {
    const el = document.querySelector('input[name="' + q.id + '"]:checked');
    if (el) {
      const v = parseInt(el.value, 10);
      answersByQ[q.id] = v;
      sums[q.trait] = (sums[q.trait] || 0) + v;
      counts[q.trait] = (counts[q.trait] || 0) + 1;
      any = true;
    }
  });
  if (!any) return null;
  // compute per-trait averages (1-5) then normalize to 0-1
  const traitAverages = {};
  const traitNormalized = {};
  Object.keys(sums).forEach((t) => {
    const avg = sums[t] / counts[t];
    traitAverages[t] = avg;
    // normalize 1..5 -> 0..1
    traitNormalized[t] = (avg - 1) / 4;
  });
  return { answersByQ, traitAverages, traitNormalized };
}

/**
 * Render the list of projects using optional filters.
 * Supported filter options:
 *  - text: string search across title/abstract/authors/institution/stage
 *  - stage: stage string (exact)
 *  - advantage / advantages: string or array of advantage tags
 *  - advMatchMode: 'any' | 'all'
 * @param {Object} opts
 */
function renderProjectsFiltered(opts) {
  opts = opts || {};
  const list = $("#projects-list");
  if (!list) return;
  list.innerHTML = "";
  const projects = loadProjects();
  const filtered = projects.filter((p) => {
    // favorites filter (boolean flag)
    if (opts.favorites || opts.favoritesOnly) {
      if (!p.favorite) return false;
    }
    if (opts.stage && opts.stage.trim()) {
      if ((p.stage || "").toLowerCase() !== opts.stage.trim().toLowerCase())
        return false;
    }
    // support single or multiple advantage filters
    if (opts.advantage || opts.advantages) {
      const advs = Array.isArray(opts.advantages)
        ? opts.advantages.map((a) => (a || "").toLowerCase())
        : opts.advantage && opts.advantage.trim()
        ? [opts.advantage.trim().toLowerCase()]
        : [];
      if (advs.length) {
        const projectAdvs = (p.advantages || []).map((a) =>
          (a || "").toLowerCase()
        );
        const mode = opts.advMatchMode === "all" ? "all" : "any";
        if (mode === "any") {
          // at least one adv matches
          const ok = advs.some((a) => projectAdvs.includes(a));
          if (!ok) return false;
        } else {
          // all selected advs must be present on project
          const ok = advs.every((a) => projectAdvs.includes(a));
          if (!ok) return false;
        }
      }
    }
    if (opts.text && opts.text.trim()) {
      const t = opts.text.trim().toLowerCase();
      const inTitle = (p.title || "").toLowerCase().includes(t);
      const inAbstract = (p.abstract || "").toLowerCase().includes(t);
      const inAuthors = (p.authors || "").toLowerCase().includes(t);
      const inInstitution = (p.institution || "").toLowerCase().includes(t);
      const inStage = (p.stage || "").toLowerCase().includes(t);
      const inOwnerName = (p.ownerName || "").toLowerCase().includes(t);
      const inOwnerEmail = (p.ownerEmail || "").toLowerCase().includes(t);
      const inAdvantages = (p.advantages || []).some((a) =>
        (a || "").toLowerCase().includes(t)
      );
      if (
        !(
          inTitle ||
          inAbstract ||
          inAuthors ||
          inInstitution ||
          inStage ||
          inOwnerName ||
          inOwnerEmail ||
          inAdvantages
        )
      )
        return false;
    }
    return true;
  });
  if (!filtered.length) {
    list.innerHTML =
      '<div class="small">No papers yet — submit the first one.</div>';
    return;
  }
  filtered.forEach((p) => {
    const el = document.createElement("div");
    el.className = "project-card";
    const left = document.createElement("div");
    left.className = "left";
    left.innerHTML = `<h3>${escapeHtml(
      p.title
    )}</h3><div class="meta">${escapeHtml(p.authors || "")} — ${escapeHtml(
      p.institution || ""
    )} ${
      p.stage ? "• " + escapeHtml(p.stage) : ""
    }</div><div class="small">${escapeHtml(p.abstract || "")}</div>`;
    const tags = document.createElement("div");
    tags.className = "tags";
    (p.advantages || []).forEach((a) => {
      const t = document.createElement("div");
      t.className = "tag-chip";
      t.textContent = a;
      tags.appendChild(t);
    });
    left.appendChild(tags);
    // show timestamps
    const metaTime = document.createElement("div");
    metaTime.className = "small";
    const created = p.createdAt ? formatDate(p.createdAt) : null;
    const updated = p.updatedAt ? formatDate(p.updatedAt) : null;
    metaTime.textContent = updated
      ? `Updated: ${updated}`
      : created
      ? `Created: ${created}`
      : "";
    if (metaTime.textContent) left.appendChild(metaTime);
    // if project has declared traits, render a small radar beside the card
    if (p.traits) {
      const norm = Object.fromEntries(
        Object.keys(p.traits).map((k) => [k, (p.traits[k] - 1) / 4])
      );
      const radarWrap = document.createElement("div");
      radarWrap.className = "project-radar";
      radarWrap.innerHTML = buildRadarSvg(norm, 84, false);
      // insert radar at top of left column
      left.insertBefore(radarWrap, left.firstChild);
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.style.display = "flex";
    actions.style.flexDirection = "column";
    actions.style.gap = "8px";
    const joinBtn = document.createElement("button");
    joinBtn.className = "btn";
    joinBtn.textContent = "Join / Offer help";
    joinBtn.onclick = () => {
      const pf = loadProfile();
      if (!pf) {
        alert("Please complete your profile before joining.");
        return;
      }
      const ok = joinProject(p.id, pf);
      if (ok) alert("You were added as a joiner to this project.");
    };
    const viewBtn = document.createElement("button");
    viewBtn.className = "btn primary";
    viewBtn.textContent = "View Details";
    viewBtn.onclick = () => {
      showProjectDetails(p);
    };
    actions.appendChild(joinBtn);
    actions.appendChild(viewBtn);
    // favorite / bookmark button (icon-only)
    const favBtn = document.createElement("button");
    favBtn.className = "btn fav-btn";
    favBtn.setAttribute("aria-pressed", p.favorite ? "true" : "false");
    favBtn.setAttribute(
      "title",
      p.favorite ? "Unfavorite project" : "Favorite project"
    );
    favBtn.innerHTML = `<span class="fav-icon" aria-hidden="true">${
      p.favorite ? "★" : "☆"
    }</span><span class="visually-hidden">${
      p.favorite ? "Unfavorite project" : "Favorite project"
    }</span>`;
    favBtn.onclick = () => {
      toggleFavorite(p.id);
    };
    actions.appendChild(favBtn);
    // show edit/delete for owner
    const pf = loadProfile();
    if (pf && pf.email && p.ownerEmail && pf.email === p.ownerEmail) {
      const editBtn = document.createElement("button");
      editBtn.className = "btn";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => editProject(p.id);
      const delBtn = document.createElement("button");
      delBtn.className = "btn";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => deleteProject(p.id);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
    }
    el.appendChild(left);
    el.appendChild(actions);

    // show owner info if present
    if (p.ownerName || p.ownerEmail) {
      const ownerDiv = document.createElement("div");
      ownerDiv.className = "small";
      ownerDiv.style.marginTop = "8px";
      const parts = [];
      if (p.ownerName) parts.push(escapeHtml(p.ownerName));
      if (p.ownerEmail)
        parts.push(
          '<span class="muted">&lt;' + escapeHtml(p.ownerEmail) + "&gt;</span>"
        );
      ownerDiv.innerHTML = "Owner: " + parts.join(" ");
      el.appendChild(ownerDiv);
    }

    const joiners = document.createElement("div");
    joiners.className = "small";
    joiners.style.marginTop = "8px";
    joiners.textContent =
      "Joiners: " +
      ((p.joiners || [])
        .map((j) => j.name)
        .slice(0, 5)
        .join(", ") || "—");
    el.appendChild(joiners);

    // show created/updated timestamps if available
    if (p.createdAt || p.updatedAt) {
      const ts = document.createElement("div");
      ts.className = "small";
      ts.style.marginTop = "6px";
      ts.innerHTML =
        (p.createdAt ? "Created: " + escapeHtml(formatDate(p.createdAt)) : "") +
        (p.updatedAt
          ? (p.createdAt ? " • " : "") +
            "Updated: " +
            escapeHtml(formatDate(p.updatedAt))
          : "");
      el.appendChild(ts);
    }

    list.appendChild(el);
  });
}

/**
 * Seed demo data into localStorage.
 * If `force` is true, overwrite existing data without prompting.
 * Used by tests and the demo seed UI.
 * @param {boolean} force
 */
function seedDemo(force) {
  if (!force && (loadProjects().length || loadCourses().length)) {
    if (!confirm("Local data exists. Overwrite with demo seed?")) return;
  }
  // seed projects
  const seeded = DEMO_PROJECTS.map((p, i) => ({
    ...p,
    id: "p_demo_" + i,
    joiners: [],
    ownerEmail: `demo${i}@example.com`,
    ownerName: p.authors || `Demo Author ${i + 1}`,
    createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
  }));
  write(LS_KEYS.PROJECTS, seeded);
  // seed courses
  write(LS_KEYS.COURSES, SAMPLE_COURSES);
  // seed roles stored on window for populating selects
  window._canapp_roles = DEMO_ROLES.slice();
  // refresh UI
  populateRoles();
  renderProjects();
  renderCourses();
  renderProfile();
  alert("Demo data seeded (localStorage).");
}

/**
 * Show a modal with full project details.
 * Renders trait radars (overlay with user traits when available), joiners,
 * timestamps, and owner controls where applicable.
 * @param {Object} p
 */
function showProjectDetails(p) {
  const modal = document.createElement("div");
  modal.className = "canapp-project-modal";
  modal.setAttribute("data-project-id", p.id || "");
  modal.style.position = "fixed";
  modal.style.zIndex = 9999;
  modal.style.left = 0;
  modal.style.top = 0;
  modal.style.right = 0;
  modal.style.bottom = 0;
  modal.style.background = "rgba(2,6,15,0.7)";
  const card = document.createElement("div");
  card.style.maxWidth = "760px";
  card.style.margin = "60px auto";
  card.style.background = "var(--panel)";
  card.style.padding = "18px";
  card.style.borderRadius = "10px";
  let detailsHtml = `<h2>${escapeHtml(
    p.title
  )}</h2><div class="small">${escapeHtml(p.authors || "")} — ${escapeHtml(
    p.institution || ""
  )}</div><p>${escapeHtml(
    p.abstract || ""
  )}</p><div class="small">Strategic: ${(p.advantages || []).join(", ")}</div>`;
  if (p.traits) {
    const projNorm = Object.fromEntries(
      Object.keys(p.traits).map((k) => [k, (p.traits[k] - 1) / 4])
    );
    // attempt to load user profile normalized traits
    const pf = loadProfile();
    const userNorm =
      (pf && pf.traitNormalized) ||
      (pf && pf.traits
        ? Object.fromEntries(
            Object.keys(pf.traits).map((k) => [k, (pf.traits[k] - 1) / 4])
          )
        : null);
    if (userNorm) {
      detailsHtml += `<div style="margin-top:12px">${buildOverlayRadarSvg(
        userNorm,
        projNorm,
        220
      )}</div>`;
      detailsHtml += `<div class="radar-legend"><div class="key"><span class="swatch user"></span>User</div><div class="key"><span class="swatch project"></span>Project</div></div>`;
    } else {
      detailsHtml += `<div style="margin-top:12px">${buildRadarSvg(
        projNorm,
        200,
        true
      )}</div>`;
    }
  }
  detailsHtml += `<div style="margin-top:12px" class="small">Joiners: —</div>`;
  if (p.createdAt || p.updatedAt) {
    detailsHtml += `<div class="small" style="margin-top:8px">${
      p.createdAt ? "Created: " + formatDate(p.createdAt) : ""
    }${
      p.updatedAt
        ? (p.createdAt ? " • " : "") + "Updated: " + formatDate(p.updatedAt)
        : ""
    }</div>`;
  }
  card.innerHTML = detailsHtml;

  // add favorite toggle button in modal header (next to title)
  try {
    const h2 = card.querySelector("h2");
    if (h2) {
      const favModalBtn = document.createElement("button");
      favModalBtn.className = "btn fav-btn modal-fav";
      const isFav = !!p.favorite;
      favModalBtn.setAttribute("aria-pressed", isFav ? "true" : "false");
      favModalBtn.setAttribute(
        "title",
        isFav ? "Unfavorite project" : "Favorite project"
      );
      favModalBtn.innerHTML = `<span class="fav-icon" aria-hidden="true">${
        isFav ? "★" : "☆"
      }</span><span class="visually-hidden">${
        isFav ? "Unfavorite project" : "Favorite project"
      }</span>`;
      favModalBtn.style.marginLeft = "12px";
      favModalBtn.onclick = () => {
        // toggle persisted flag and update this button state to reflect current value
        toggleFavorite(p.id);
        try {
          const updated = loadProjects().find((x) => x.id === p.id) || {};
          const nowFav = !!updated.favorite;
          favModalBtn.setAttribute("aria-pressed", nowFav ? "true" : "false");
          favModalBtn.setAttribute(
            "title",
            nowFav ? "Unfavorite project" : "Favorite project"
          );
          const icon = favModalBtn.querySelector(".fav-icon");
          if (icon) icon.textContent = nowFav ? "★" : "☆";
        } catch (e) {}
      };
      // insert after the H2 so it appears inline with the title
      h2.parentNode.insertBefore(favModalBtn, h2.nextSibling);
    }
  } catch (e) {}

  // Render joiners as interactive list (owners can remove)
  const pf = loadProfile();
  const joinersWrap = document.createElement("div");
  joinersWrap.className = "small";
  joinersWrap.style.marginTop = "12px";
  if ((p.joiners || []).length === 0) {
    joinersWrap.textContent = "Joiners: —";
  } else {
    const title = document.createElement("div");
    title.textContent = "Joiners:";
    joinersWrap.appendChild(title);
    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "6px";
    (p.joiners || []).forEach((j) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      const label = document.createElement("div");
      label.textContent = j.name || j.email || "—";
      row.appendChild(label);
      // if viewer is the owner, show remove button
      if (pf && pf.email && p.ownerEmail && pf.email === p.ownerEmail) {
        const rem = document.createElement("button");
        rem.className = "btn";
        rem.textContent = "Remove";
        rem.onclick = () => {
          if (!confirm("Remove " + (j.name || j.email) + " from joiners?"))
            return;
          removeJoiner(p.id, j.email);
        };
        row.appendChild(rem);
      }
      list.appendChild(row);
    });
    joinersWrap.appendChild(list);
  }
  card.appendChild(joinersWrap);

  const close = document.createElement("button");
  close.className = "btn";
  close.textContent = "Close";
  close.onclick = () => document.body.removeChild(modal);
  card.appendChild(close);
  modal.appendChild(card);
  document.body.appendChild(modal);
}

/**
 * Render profile form values and matching / trait summaries for the saved profile.
 * If no profile exists, clears the form and shows placeholder UI.
 */
function renderProfile() {
  const pf = loadProfile();
  if (!pf) {
    $("#profile-form").reset();
    $("#matching-result").innerHTML =
      '<div class="small">No profile saved.</div>';
    // clear trait summary
    const ts = $("#trait-summary");
    if (ts) ts.innerHTML = '<div class="small">No personality data.</div>';
    return;
  }
  $("#user-name").value = pf.name || "";
  $("#user-email").value = pf.email || "";
  $("#role-pref").value = pf.role || "Entrepreneur / Founder";
  $("#user-skills").value = (pf.skills || []).join(", ");
  renderMatches();
  renderTraitSummary(pf);
  renderTraitRadar(pf);
}

/**
 * Render a compact radar visualization for the given profile's normalized traits.
 * Expects `pf.traitNormalized` or `pf.traits` (1..5) to be present.
 * @param {Object} pf
 */
function renderTraitRadar(pf) {
  const container = $("#trait-radar");
  if (!container) return;
  const normalized =
    pf.traitNormalized ||
    (pf.traits
      ? Object.fromEntries(
          Object.keys(pf.traits).map((k) => [k, (pf.traits[k] - 1) / 4])
        )
      : null);
  if (!normalized) {
    container.innerHTML = '<div class="small">No personality data.</div>';
    return;
  }
  // radar parameters
  const order = [
    "drive",
    "collaboration",
    "technical",
    "risk_aversion",
    "speed",
    "compliance",
    "scale",
    "long_term",
  ];
  const size = 160;
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 12;
  const angleStep = (Math.PI * 2) / order.length;
  // build points for the user's polygon
  const points = order
    .map((t, i) => {
      const v = typeof normalized[t] === "number" ? normalized[t] : 0.5;
      const rad = v * r;
      const ang = -Math.PI / 2 + i * angleStep; // start at top
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      return `${x},${y}`;
    })
    .join(" ");
  // grid (3 rings)
  const rings = [0.33, 0.66, 1]
    .map((f) => {
      const pts = order
        .map((t, i) => {
          const ang = -Math.PI / 2 + i * angleStep;
          const x = cx + Math.cos(ang) * r * f;
          const y = cy + Math.sin(ang) * r * f;
          return `${x},${y}`;
        })
        .join(" ");
      return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
    })
    .join("\n");
  // axis labels positions
  const labels = order
    .map((t, i) => {
      const ang = -Math.PI / 2 + i * angleStep;
      const x = cx + Math.cos(ang) * (r + 12);
      const y = cy + Math.sin(ang) * (r + 12) + 4;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(
        1
      )}" font-size="11" fill="var(--muted)" text-anchor="middle">${t.replaceAll(
        "_",
        " "
      )}</text>`;
    })
    .join("\n");
  const svg = buildRadarSvg(normalized, size, true);
  container.innerHTML = svg;
}

/**
 * Build a radar SVG string from normalized trait values (0..1).
 * Returns an inline SVG string suitable for insertion into the DOM.
 * @param {Object} normalized - map of trait -> 0..1
 * @param {number} [size=160]
 * @param {boolean} [showLabels=false]
 * @returns {string}
 */
function buildRadarSvg(normalized, size = 160, showLabels = false) {
  const order = [
    "drive",
    "collaboration",
    "technical",
    "risk_aversion",
    "speed",
    "compliance",
    "scale",
    "long_term",
  ];
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 12;
  const angleStep = (Math.PI * 2) / order.length;
  const points = order
    .map((t, i) => {
      const v = typeof normalized[t] === "number" ? normalized[t] : 0.5;
      const rad = v * r;
      const ang = -Math.PI / 2 + i * angleStep; // start at top
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      return `${x},${y}`;
    })
    .join(" ");
  const rings = [0.33, 0.66, 1]
    .map((f) => {
      const pts = order
        .map((t, i) => {
          const ang = -Math.PI / 2 + i * angleStep;
          const x = cx + Math.cos(ang) * r * f;
          const y = cy + Math.sin(ang) * r * f;
          return `${x},${y}`;
        })
        .join(" ");
      return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
    })
    .join("\n");
  const labels = showLabels
    ? order
        .map((t, i) => {
          const ang = -Math.PI / 2 + i * angleStep;
          const x = cx + Math.cos(ang) * (r + 12);
          const y = cy + Math.sin(ang) * (r + 12) + 4;
          return `<text x="${x.toFixed(1)}" y="${y.toFixed(
            1
          )}" font-size="11" fill="var(--muted)" text-anchor="middle">${t.replaceAll(
            "_",
            " "
          )}</text>`;
        })
        .join("\n")
    : "";
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" x2="100%">
          <stop offset="0%" stop-color="#37b6a7" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#4caf50" stop-opacity="0.9" />
        </linearGradient>
      </defs>
      ${rings}
      ${order
        .map((t, i) => {
          const ang = -Math.PI / 2 + i * angleStep;
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r;
          return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(
            1
          )}" y2="${y.toFixed(
            1
          )}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
        })
        .join("\n")}
      <polygon points="${points}" fill="url(#g1)" fill-opacity="0.6" stroke="#37b6a7" stroke-width="1.5" />
      ${labels}
    </svg>
  `;
}

/**
 * Build an overlay radar SVG that shows user and project polygons.
 * Useful for visual trait comparisons.
 * @param {Object} userNorm - normalized user traits
 * @param {Object} projNorm - normalized project traits
 * @param {number} [size=200]
 * @returns {string}
 */
function buildOverlayRadarSvg(userNorm, projNorm, size = 200) {
  const order = [
    "drive",
    "collaboration",
    "technical",
    "risk_aversion",
    "speed",
    "compliance",
    "scale",
    "long_term",
  ];
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 12;
  const angleStep = (Math.PI * 2) / order.length;
  const pointsFor = (norm) =>
    order
      .map((t, i) => {
        const v = typeof norm[t] === "number" ? norm[t] : 0;
        const rad = v * r;
        const ang = -Math.PI / 2 + i * angleStep;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        return `${x},${y}`;
      })
      .join(" ");
  const userPts = pointsFor(userNorm);
  const projPts = pointsFor(projNorm);
  const rings = [0.33, 0.66, 1]
    .map((f) => {
      const pts = order
        .map((t, i) => {
          const ang = -Math.PI / 2 + i * angleStep;
          const x = cx + Math.cos(ang) * r * f;
          const y = cy + Math.sin(ang) * r * f;
          return `${x},${y}`;
        })
        .join(" ");
      return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
    })
    .join("\n");
  const labels = order
    .map((t, i) => {
      const ang = -Math.PI / 2 + i * angleStep;
      const x = cx + Math.cos(ang) * (r + 12);
      const y = cy + Math.sin(ang) * (r + 12) + 4;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(
        1
      )}" font-size="11" fill="var(--muted)" text-anchor="middle">${t.replaceAll(
        "_",
        " "
      )}</text>`;
    })
    .join("\n");

  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="userG" x1="0%" x2="100%">
          <stop offset="0%" stop-color="#37b6a7" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#4caf50" stop-opacity="0.9" />
        </linearGradient>
        <linearGradient id="projG" x1="0%" x2="100%">
          <stop offset="0%" stop-color="#ffb74d" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#ff8a65" stop-opacity="0.95" />
        </linearGradient>
      </defs>
      ${rings}
      ${order
        .map((t, i) => {
          const ang = -Math.PI / 2 + i * angleStep;
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r;
          return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(
            1
          )}" y2="${y.toFixed(
            1
          )}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
        })
        .join("\n")}
      <polygon points="${projPts}" fill="url(#projG)" fill-opacity="0.45" stroke="#ff8a65" stroke-width="1" />
      <polygon points="${userPts}" fill="url(#userG)" fill-opacity="0.55" stroke="#37b6a7" stroke-width="1.5" />
      ${labels}
    </svg>
  `;
}

/**
 * Render a simple trait summary bar chart for the given profile.
 * Accepts either `pf.traitNormalized` (0..1) or `pf.traits` (1..5).
 * @param {Object} pf
 */
function renderTraitSummary(pf) {
  const container = $("#trait-summary");
  if (!container) return;
  const normalized =
    pf.traitNormalized ||
    (() => {
      // fallback: convert pf.traits (1..5) to 0..1
      if (!pf.traits) return null;
      const out = {};
      Object.keys(pf.traits).forEach((k) => {
        const v = pf.traits[k];
        out[k] = (v - 1) / 4;
      });
      return out;
    })();
  if (!normalized) {
    container.innerHTML = '<div class="small">No personality data.</div>';
    return;
  }
  // order traits for display
  const order = [
    "drive",
    "collaboration",
    "technical",
    "risk_aversion",
    "speed",
    "compliance",
    "scale",
    "long_term",
  ];
  container.innerHTML = "";
  order.forEach((t) => {
    const val = typeof normalized[t] === "number" ? normalized[t] : 0.5;
    const pct = Math.round(val * 100);
    const row = document.createElement("div");
    row.className = "trait-row";
    const label = document.createElement("div");
    label.className = "trait-label";
    label.textContent = t.replaceAll("_", " ");
    const bar = document.createElement("div");
    bar.className = "trait-bar";
    const fill = document.createElement("div");
    fill.className = "trait-fill";
    fill.style.width = pct + "%";
    const value = document.createElement("div");
    value.className = "trait-value";
    value.textContent = pct + "%";
    bar.appendChild(fill);
    row.appendChild(label);
    row.appendChild(bar);
    row.appendChild(value);
    container.appendChild(row);
  });
}

// Simple matching: score projects by #matching keywords between project advantages+title+abstract and user skills/role
/**
 * Render the top project matches for the saved profile.
 * Uses scoreMatch() to compute a numeric score per project.
 */
function renderMatches() {
  const pf = loadProfile();
  const output = $("#matching-result");
  if (!pf) {
    output.innerHTML =
      '<div class="small">Save a profile to see matches.</div>';
    return;
  }
  const projects = loadProjects();
  const scores = projects
    .map((p) => ({ p, score: scoreMatch(p, pf) }))
    .sort((a, b) => b.score - a.score);
  if (!scores.length) {
    output.innerHTML = '<div class="small">No projects.</div>';
    return;
  }
  output.innerHTML = "";
  scores.slice(0, 6).forEach((s) => {
    const el = document.createElement("div");
    el.className = "match-row";
    el.style.marginBottom = "8px";
    el.innerHTML = `<strong>${escapeHtml(
      s.p.title
    )}</strong> <div class="small">Matching skills: ${s.score}</div>`;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "View";
    btn.onclick = () => showProjectDetails(s.p);
    el.appendChild(btn);
    output.appendChild(el);
  });
}

/**
 * Compute a heuristic numeric score for how well profile `pf` matches project `p`.
 * This combines simple keyword matching, role/institution signals, and
 * an approximate trait-distance heuristic when trait data exists.
 * @param {Object} p
 * @param {Object} pf
 * @returns {number}
 */
function scoreMatch(p, pf) {
  let score = 0;
  const text = (
    p.title +
    " " +
    (p.abstract || "") +
    " " +
    (p.advantages || []).join(" ")
  ).toLowerCase();
  (pf.skills || []).forEach((skill) => {
    if (!skill) return;
    if (text.includes(skill.toLowerCase())) score += 3;
  });
  if ((p.advantages || []).includes(pf.role)) score += 2;
  if (
    p.institution &&
    pf.affiliation &&
    p.institution.toLowerCase().includes((pf.affiliation || "").toLowerCase())
  )
    score += 1;
  // Trait-based matching: infer project trait vector from advantages
  const ADV_TO_TRAITS = {
    "Cheap Energy": { drive: 3, technical: 2, scale: 2 },
    "Data Centres": { technical: 3, scale: 3, compliance: 2 },
    Methane: { technical: 2, compliance: 2, drive: 2 },
    Nuclear: { technical: 4, compliance: 4, risk_aversion: 3 },
    "Land & Lumber": { long_term: 3, collaboration: 2 },
    Resources: { long_term: 2, scale: 2 },
    "AI / Compute": { technical: 4, speed: 3 },
  };
  // Only compute trait similarity if the user has trait data
  const userNorm =
    pf.traitNormalized ||
    (pf.traits
      ? Object.fromEntries(
          Object.keys(pf.traits).map((k) => [k, (pf.traits[k] - 1) / 4])
        )
      : null);
  if (userNorm) {
    if (p.traits) {
      // project has declared traits (1..5) — use them directly
      const projNorm = Object.fromEntries(
        Object.keys(p.traits).map((k) => [k, (p.traits[k] - 1) / 4])
      );
      const dims = Array.from(
        new Set([...Object.keys(userNorm), ...Object.keys(projNorm)])
      );
      let sumSq = 0;
      dims.forEach((d) => {
        const pt = typeof projNorm[d] === "number" ? projNorm[d] : 0;
        const vt = typeof userNorm[d] === "number" ? userNorm[d] : 0.5;
        const diff = vt - pt;
        sumSq += diff * diff;
      });
      const dist = Math.sqrt(sumSq);
      const maxDist = Math.sqrt(dims.length);
      const closeness = 1 - Math.min(dist / maxDist, 1);
      const traitScore = Math.round(closeness * 6);
      score += traitScore;
    } else {
      // fallback: infer project trait vector from advantages (legacy heuristic)
      const projTraits = {};
      (p.advantages || []).forEach((a) => {
        const map = ADV_TO_TRAITS[a];
        if (!map) return;
        Object.keys(map).forEach((k) => {
          projTraits[k] = (projTraits[k] || 0) + map[k];
        });
      });
      if (Object.keys(projTraits).length) {
        const maxVal = Math.max(...Object.values(projTraits));
        const dims = Array.from(
          new Set([...Object.keys(userNorm), ...Object.keys(projTraits)])
        );
        let sumSq = 0;
        dims.forEach((d) => {
          const ptRaw = projTraits[d] || 0;
          const pt = maxVal > 0 ? ptRaw / maxVal : 0; // normalize proj trait to 0..1
          const vt = typeof userNorm[d] === "number" ? userNorm[d] : 0.5;
          const diff = vt - pt;
          sumSq += diff * diff;
        });
        const dist = Math.sqrt(sumSq);
        const maxDist = Math.sqrt(dims.length);
        const closeness = 1 - Math.min(dist / maxDist, 1);
        const traitScore = Math.round(closeness * 6);
        score += traitScore;
      }
    }
  }
  return score;
}

// Courses
/**
 * Render the courses list and wire the enroll buttons.
 */
function renderCourses() {
  const list = $("#courses-list");
  const courses = loadCourses();
  list.innerHTML = "";
  courses.forEach((c) => {
    const el = document.createElement("div");
    el.className = "course";
    el.innerHTML = `<div><div><strong>${escapeHtml(
      c.title
    )}</strong></div><div class="small">${escapeHtml(
      c.provider
    )} • ${escapeHtml(c.duration)}</div></div>`;
    const btn = document.createElement("button");
    btn.className = "btn primary";
    btn.textContent = "Enroll";
    btn.onclick = () => enrollCourse(c.id);
    el.appendChild(btn);
    list.appendChild(el);
  });
}

// Helpers & event wiring
/**
 * Escape user-provided text for safe insertion into HTML fragments.
 * Simple replacement for <, > and &.
 * @param {string} s
 * @returns {string}
 */
function escapeHtml(s) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Format an ISO timestamp into a localized human-friendly string.
 * Falls back to the raw input on error.
 * @param {string} iso
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

/**
 * Toggle favorite (bookmark) status for a project and persist it.
 * @param {string} projectId
 */
function toggleFavorite(projectId) {
  try {
    const ps = loadProjects();
    const idx = ps.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    ps[idx].favorite = !ps[idx].favorite;
    write(LS_KEYS.PROJECTS, ps);
    renderProjects();
    showToast(
      ps[idx].favorite ? "Added to Favorites" : "Removed from Favorites"
    );
  } catch (e) {
    // ignore
  }
}

/**
 * Initialize the app UI: wire form handlers, chips, theme toggle,
 * import/export, quick-search, and perform the initial render.
 * This is invoked at the bottom of the file on module load.
 */
function init() {
  // setup chips
  $$("#advantage-chips .chip").forEach((ch) => {
    ch.onclick = () => {
      ch.classList.toggle("active");
      enforceChipLimit(3);
    };
  });
  $("#paper-form").onsubmit = (e) => {
    e.preventDefault();
    const title = $("#paper-title").value.trim();
    const authors = $("#paper-authors").value.trim();
    const institution = $("#paper-institution").value;
    const abstract = $("#paper-abstract").value.trim();
    const advantages = $$("#advantage-chips .chip.active").map(
      (x) => x.textContent
    );
    // read optional project trait selects (1..5)
    const traitKeys = [
      "drive",
      "collaboration",
      "technical",
      "risk_aversion",
      "speed",
      "compliance",
      "scale",
      "long_term",
    ];
    const traits = {};
    traitKeys.forEach((k) => {
      const el = $("#proj-trait-" + k);
      if (el && el.value) traits[k] = parseInt(el.value, 10);
    });
    const stage = (document.getElementById("paper-stage") || {}).value || "";
    const proj = { title, authors, institution, abstract, advantages, stage };
    const editId = $("#edit-project-id").value;
    if (editId) proj.id = editId;
    // if creating new project, attach ownerEmail and ownerName from profile (if available)
    const pf = loadProfile();
    if (!proj.id && pf && pf.email) proj.ownerEmail = pf.email;
    if (!proj.id && pf && pf.name) proj.ownerName = pf.name;
    // if updating, preserve existing ownerEmail/ownerName unless explicitly changed
    if (proj.id) {
      const existing = loadProjects().find((x) => x.id === proj.id) || {};
      proj.ownerEmail = proj.ownerEmail || existing.ownerEmail;
      proj.ownerName = proj.ownerName || existing.ownerName;
    }
    if (Object.keys(traits).length) proj.traits = traits;
    saveProject(proj);
    try {
      // show a small confetti burst on successful submit (respecting reduced-motion)
      if (
        !(
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
      ) {
        const submitBtn = document.getElementById("submit-paper");
        if (typeof showConfetti === "function")
          showConfetti(submitBtn, { count: 36 });
      }
    } catch (e) {}
    $("#paper-form").reset();
    $$("#advantage-chips .chip").forEach((c) => c.classList.remove("active"));
    // clear edit state UI
    $("#edit-project-id").value = "";
    const cancel = $("#cancel-edit");
    if (cancel) cancel.style.display = "none";
  };
  $("#reset-form").onclick = () => {
    if (confirm("Clear form?")) $("#paper-form").reset();
    $$("#advantage-chips .chip").forEach((c) => c.classList.remove("active"));
  };

  $("#profile-form").onsubmit = (e) => {
    e.preventDefault();
    const name = $("#user-name").value.trim();
    const email = $("#user-email").value.trim();
    const role = $("#role-pref").value;
    const skills = $("#user-skills")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const pf = { name, email, role, skills, affiliation: null };
    saveProfile(pf);
    alert("Profile saved locally.");
  };
  $("#clear-profile").onclick = () => {
    if (confirm("Clear saved profile?")) clearProfile();
  };

  // cancel edit button
  const cancelEdit = $("#cancel-edit");
  if (cancelEdit) {
    cancelEdit.onclick = () => {
      $("#paper-form").reset();
      $$("#advantage-chips .chip").forEach((c) => c.classList.remove("active"));
      $("#edit-project-id").value = "";
      cancelEdit.style.display = "none";
    };
  }

  // personality form handling
  renderPersonalityQuestions();
  $("#personality-form").onsubmit = (e) => {
    e.preventDefault();
    const ans = collectPersonalityAnswers();
    if (!ans) {
      alert("Please answer at least one question.");
      return;
    }
    const pf = loadProfile() || {
      name: "",
      email: "",
      role: "Entrepreneur / Founder",
      skills: [],
    };
    // store detailed personality data:
    // per-question answers, per-trait averages (1-5), and normalized (0-1)
    pf.personalityAnswers = ans.answersByQ;
    pf.traits = ans.traitAverages;
    pf.traitNormalized = ans.traitNormalized;
    saveProfile(pf);
    alert("Personality saved to your profile.");
  };
  $("#clear-personality").onclick = () => {
    if (confirm("Clear saved personality?")) {
      const pf = loadProfile();
      if (pf && (pf.traits || pf.personalityAnswers || pf.traitNormalized)) {
        delete pf.traits;
        delete pf.personalityAnswers;
        delete pf.traitNormalized;
        saveProfile(pf);
        alert("Personality cleared.");
        renderPersonalityQuestions();
      }
    }
  };

  // populate role dropdown
  populateRoles();

  // theme toggle wiring
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    // reflect stored theme
    const stored = (function () {
      try {
        return localStorage.getItem("slxca_theme");
      } catch (e) {
        return null;
      }
    })();
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
      themeBtn.setAttribute(
        "aria-pressed",
        stored === "light" ? "true" : "false"
      );
    } else {
      // default: use prefers-color-scheme if available
      try {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: light)").matches
        ) {
          document.documentElement.setAttribute("data-theme", "light");
          themeBtn.setAttribute("aria-pressed", "true");
        }
      } catch (e) {}
    }
    themeBtn.onclick = (ev) => {
      ev.preventDefault();
      toggleTheme();
    };
  }

  // Quick search wiring (debounced)
  const qs = document.getElementById("quick-search");
  if (qs) {
    const debounce = (fn, wait) => {
      let t = null;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    };
    const handler = debounce((ev) => {
      const v = (ev.target.value || "").trim();
      // determine current chip selections to persist with search text
      const stageEl = document.querySelector(".quick-chip.active[data-stage]");
      const stage = stageEl ? stageEl.dataset.stage : "";
      const advs = Array.from(
        document.querySelectorAll(".quick-chip.active[data-adv]")
      ).map((c) => c.dataset.adv);
      const favEl = document.querySelector(".quick-chip.active[data-fav]");
      const favorites = !!favEl;
      const advMatchMode =
        (document.getElementById("adv-match-mode") || {}).value || "any";
      renderProjectsFiltered({
        text: v,
        stage: stage,
        advantages: advs,
        advMatchMode: advMatchMode,
        favorites: favorites,
      });
      // persist UI filter state
      saveFiltersState({
        text: v,
        stage: stage,
        advantages: advs,
        advMatchMode: advMatchMode,
        favorites: favorites,
      });
    }, 180);
    qs.addEventListener("input", handler);
  }

  // Quick chips wiring: stage and advantage quick filters
  const quickChips = Array.from(document.querySelectorAll(".quick-chip"));
  if (quickChips.length) {
    quickChips.forEach((chip) => {
      chip.addEventListener("click", (ev) => {
        ev.preventDefault();
        // toggle active (allow multiple tag chips, but stage chips act as single-select)
        const isStage = chip.dataset.stage !== undefined;
        if (isStage) {
          // deactivate other stage chips
          quickChips
            .filter((c) => c.dataset.stage !== undefined)
            .forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
        } else {
          chip.classList.toggle("active");
        }
        // collect filters
        const stageEl = document.querySelector(
          ".quick-chip.active[data-stage]"
        );
        const stage = stageEl ? stageEl.dataset.stage : "";
        const advs = Array.from(
          document.querySelectorAll(".quick-chip.active[data-adv]")
        ).map((c) => c.dataset.adv);
        const favChipActive = !!document.querySelector(
          ".quick-chip.active[data-fav]"
        );
        // get adv match mode
        const advMatchMode =
          (document.getElementById("adv-match-mode") || {}).value || "any";
        // combine with text in quick-search
        const text =
          (document.getElementById("quick-search") || {}).value || "";
        renderProjectsFiltered({
          text: text.trim(),
          stage: stage,
          advantages: advs,
          advMatchMode: advMatchMode,
          favorites: favChipActive,
        });
        // persist UI filter state
        saveFiltersState({
          text: text.trim(),
          stage: stage,
          advantages: advs,
          advMatchMode: advMatchMode,
          favorites: favChipActive,
        });
      });
    });
  }

  // initial render
  // restore any saved UI filter state (search text, chips, match mode)
  restoreFiltersFromStorage();
  renderProjects();
  renderProfile();
  renderCourses();

  // How-it-works modal handlers
  const legendOpen = document.getElementById("legend-open");
  const howModal = document.getElementById("how-modal");
  const howClose = document.getElementById("how-close");
  if (legendOpen && howModal && howClose) {
    // small focus-trap utility scoped to this modal
    let lastFocusedBeforeModal = null;
    let modalKeyHandler = null;

    const getFocusable = (root) => {
      const sel =
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(root.querySelectorAll(sel)).filter((el) => {
        // filter out invisible elements
        return el.offsetWidth || el.offsetHeight || el.getClientRects().length;
      });
    };

    const openModal = () => {
      lastFocusedBeforeModal = document.activeElement;
      howModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");

      const focusable = getFocusable(howModal);
      const first = focusable[0] || howClose;
      const last = focusable[focusable.length - 1] || howClose;
      // focus the first sensible control inside the modal
      first.focus();

      modalKeyHandler = function (ev) {
        if (ev.key === "Tab") {
          // trap Tab / Shift+Tab
          const cur = document.activeElement;
          if (focusable.length === 0) {
            ev.preventDefault();
            return;
          }
          if (ev.shiftKey) {
            if (cur === first || cur === howModal) {
              ev.preventDefault();
              last.focus();
            }
          } else {
            if (cur === last) {
              ev.preventDefault();
              first.focus();
            }
          }
        } else if (ev.key === "Escape") {
          // allow Esc to close
          closeModal();
        }
      };
      document.addEventListener("keydown", modalKeyHandler);
    };

    const closeModal = () => {
      howModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (modalKeyHandler) {
        document.removeEventListener("keydown", modalKeyHandler);
        modalKeyHandler = null;
      }
      if (
        lastFocusedBeforeModal &&
        typeof lastFocusedBeforeModal.focus === "function"
      ) {
        lastFocusedBeforeModal.focus();
      }
      lastFocusedBeforeModal = null;
    };

    legendOpen.onclick = (ev) => {
      ev.preventDefault();
      openModal();
    };
    howClose.onclick = closeModal;
    // also close if backdrop clicked (user clicked outside modal-card)
    howModal.addEventListener("click", (ev) => {
      if (ev.target === howModal) closeModal();
    });
  }

  // Export / Import local data handlers
  const exportBtn = document.getElementById("export-data");
  const importBtn = document.getElementById("import-data");
  const importFile = document.getElementById("import-file");
  if (exportBtn) {
    exportBtn.onclick = () => {
      const data = {
        projects: loadProjects(),
        profile: loadProfile(),
        courses: loadCourses(),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slxca-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }
  // Feed exports (JSON + RSS)
  const exportFeedJson = document.getElementById("export-feed-json");
  const exportFeedRss = document.getElementById("export-feed-rss");
  function buildFeedItems(projects) {
    return (projects || []).map((p) => ({
      id: p.id || null,
      title: p.title || "(untitled)",
      authors: p.authors || "",
      institution: p.institution || "",
      abstract: p.abstract || "",
      advantages: p.advantages || [],
      stage: p.stage || "",
      createdAt: p.createdAt || null,
      updatedAt: p.updatedAt || null,
      url:
        (location.href.replace(/\/[^/]*$/, "/") || "") +
        (p.id ? `#project-${p.id}` : ""),
    }));
  }
  if (exportFeedJson) {
    exportFeedJson.onclick = () => {
      const projects = loadProjects();
      const feed = {
        version: "https://jsonfeed.org/version/1",
        title: "SLXCA Projects Feed",
        home_page_url: location.href.replace(/\/[^/]*$/, "/"),
        feed_url: location.href.replace(/\/[^/]*$/, "/") + "feed.json",
        items: buildFeedItems(projects),
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(feed, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slxca-feed-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }
  if (exportFeedRss) {
    exportFeedRss.onclick = () => {
      const projects = loadProjects();
      const items = buildFeedItems(projects);
      const feedTitle = "SLXCA Projects Feed";
      const home = location.href.replace(/\/[^/]*$/, "/");
      const feedUpdated =
        (projects[0] && (projects[0].updatedAt || projects[0].createdAt)) ||
        new Date().toISOString();
      const xmlItems = items
        .map((it) => {
          const pubDate =
            it.updatedAt || it.createdAt || new Date().toISOString();
          return `<item>
  <title><![CDATA[${it.title}]]></title>
  <link>${escapeHtml(home)}</link>
  <guid isPermaLink="false">${it.id || ""}</guid>
  <description><![CDATA[${it.authors ? it.authors + " — " : ""}${
            it.abstract
          }]]></description>
  <category>${(it.advantages || [])
    .map((a) => escapeHtml(a))
    .join(", ")}</category>
  <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
</item>`;
        })
        .join("\n");
      const rss = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n  <title>${escapeHtml(
        feedTitle
      )}</title>\n  <link>${escapeHtml(
        home
      )}</link>\n  <description>Recent projects from SLXCA</description>\n  <lastBuildDate>${new Date(
        feedUpdated
      ).toUTCString()}</lastBuildDate>\n${xmlItems}\n</channel>\n</rss>`;
      const blob = new Blob([rss], { type: "application/rss+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slxca-feed-${new Date().toISOString()}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }
  if (importBtn && importFile) {
    importBtn.onclick = () => importFile.click();
    importFile.onchange = (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          handleImportFile(parsed);
        } catch (err) {
          alert("Invalid JSON file.");
        }
      };
      reader.readAsText(f);
      // clear value so same file can be reselected later
      importFile.value = "";
    };
  }

  function handleImportFile(parsed) {
    if (!parsed || typeof parsed !== "object") {
      alert("Imported file does not contain valid data.");
      return;
    }
    const hasProjects = Array.isArray(parsed.projects);
    const hasProfile = parsed.profile && typeof parsed.profile === "object";
    const hasCourses = Array.isArray(parsed.courses);
    if (!hasProjects && !hasProfile && !hasCourses) {
      alert(
        "Imported JSON must contain at least one of: projects, profile, courses."
      );
      return;
    }
    // Show preview modal with counts and sample titles
    const importModal = document.getElementById("import-modal");
    const importPreview = document.getElementById("import-preview");
    const importOverwrite = document.getElementById("import-overwrite");
    const importMerge = document.getElementById("import-merge");
    const importCancel = document.getElementById("import-cancel");
    if (!importModal || !importPreview) {
      alert("Import UI not available.");
      return;
    }
    // build preview HTML
    const parts = [];
    if (hasProjects) {
      parts.push(
        `<div><strong>Projects:</strong> ${parsed.projects.length}</div>`
      );
      const list = (parsed.projects || [])
        .slice(0, 6)
        .map((p) => `<li>${escapeHtml(p.title || "(untitled)")}</li>`)
        .join("");
      parts.push(
        `<ul style="margin-top:6px">${list}${
          parsed.projects.length > 6 ? "<li>…</li>" : ""
        }</ul>`
      );
    }
    if (hasProfile) {
      parts.push(
        `<div style="margin-top:8px"><strong>Profile:</strong> ${escapeHtml(
          parsed.profile.name || "(no name)"
        )}</div>`
      );
      if (parsed.profile.traits)
        parts.push(
          `<div class="small">Profile has ${
            Object.keys(parsed.profile.traits).length
          } trait values.</div>`
        );
    }
    if (hasCourses) {
      parts.push(
        `<div style="margin-top:8px"><strong>Courses:</strong> ${parsed.courses.length}</div>`
      );
      const clist = (parsed.courses || [])
        .slice(0, 6)
        .map((c) => `<li>${escapeHtml(c.title || "(untitled)")}</li>`)
        .join("");
      parts.push(
        `<ul style="margin-top:6px">${clist}${
          parsed.courses.length > 6 ? "<li>…</li>" : ""
        }</ul>`
      );
    }
    importPreview.innerHTML = parts.join("");

    // open modal with focus trap similar to how-modal
    importModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    const focusable = Array.from(
      importModal.querySelectorAll(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length
    );
    const first = focusable[0] || importCancel;
    const last = focusable[focusable.length - 1] || importCancel;
    first.focus();
    const keyHandler = function (ev) {
      if (ev.key === "Tab") {
        const cur = document.activeElement;
        if (ev.shiftKey) {
          if (cur === first) {
            ev.preventDefault();
            last.focus();
          }
        } else {
          if (cur === last) {
            ev.preventDefault();
            first.focus();
          }
        }
      } else if (ev.key === "Escape") {
        closeImport(false);
      }
    };
    document.addEventListener("keydown", keyHandler);

    function closeImport(didImport) {
      importModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", keyHandler);
      // cleanup listeners
      importOverwrite.onclick = null;
      importMerge.onclick = null;
      importCancel.onclick = null;
      if (didImport) alert("Import complete.");
    }

    importOverwrite.onclick = () => {
      if (hasProjects) write(LS_KEYS.PROJECTS, parsed.projects || []);
      if (hasProfile) write(LS_KEYS.PROFILE, parsed.profile || null);
      if (hasCourses) write(LS_KEYS.COURSES, parsed.courses || []);
      populateRoles();
      renderProjects();
      renderCourses();
      renderProfile();
      closeImport(true);
    };
    importMerge.onclick = () => {
      if (hasProjects) {
        const existing = loadProjects();
        const merged = (parsed.projects || []).concat(existing || []);
        write(LS_KEYS.PROJECTS, merged);
      }
      if (hasProfile) write(LS_KEYS.PROFILE, parsed.profile || null);
      if (hasCourses) write(LS_KEYS.COURSES, parsed.courses || []);
      populateRoles();
      renderProjects();
      renderCourses();
      renderProfile();
      closeImport(true);
    };
    importCancel.onclick = () => closeImport(false);
  }
}

function enforceChipLimit(max) {
  const chips = $$("#advantage-chips .chip");
  const active = chips.filter((c) => c.classList.contains("active"));
  if (active.length > max) {
    active[0].classList.remove("active");
  }
}

// expose for tests
function populateRoles() {
  const sel = $("#role-pref");
  if (!sel) return;
  const roles =
    window._canapp_roles && window._canapp_roles.length
      ? window._canapp_roles
      : DEMO_ROLES;
  sel.innerHTML = "";
  roles.forEach((r) => {
    const opt = document.createElement("option");
    opt.textContent = r;
    opt.value = r;
    sel.appendChild(opt);
  });
}

// Theme helpers: persistent light/dark with small animation
function setTheme(t) {
  try {
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("slxca_theme", t);
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("slxca_theme");
    }
  } catch (e) {}
  // update button aria/state
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    const pressed =
      (document.documentElement.getAttribute("data-theme") || "") === "light";
    btn.setAttribute("aria-pressed", pressed ? "true" : "false");
  }
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "light" ? "dark" : "light";
  // add slight icon pulse for feedback
  const icon = document.querySelector(".theme-icon");
  const btn = document.getElementById("theme-toggle");
  if (icon) {
    // brief scale to give tactile feedback
    icon.style.transform = "scale(0.86)";
    setTimeout(() => (icon.style.transform = ""), 220);
  }
  if (btn) {
    btn.classList.add("theme-toggle-anim");
    setTimeout(() => btn.classList.remove("theme-toggle-anim"), 260);
  }
  setTheme(next);
}

// Small transient toast helper
function showToast(msg, ms = 1700) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => {
    el.classList.remove("show");
  }, ms);
}

// Keyboard shortcut: press 'T' (lower or upper) to toggle theme when not typing
document.addEventListener("keydown", (ev) => {
  if (!ev.key) return;
  // ignore if user is typing in form controls
  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.isContentEditable)
  )
    return;
  if (ev.key.toLowerCase() === "t") {
    ev.preventDefault();
    toggleTheme();
    const cur = document.documentElement.getAttribute("data-theme");
    showToast(cur === "light" ? "Light theme" : "Dark theme");
  }
});

window._canapp = {
  loadProjects,
  loadProfile,
  loadCourses,
  seedDemo,
  renderProjectsFiltered,
  removeJoiner,
};

init();

// Back-to-top: show button when user scrolls down; smooth-scroll to top on click.
document.addEventListener("DOMContentLoaded", () => {
  const bt = document.getElementById("back-to-top");
  if (!bt) return;
  const onScroll = () => {
    if (window.scrollY > 280) bt.classList.add("show");
    else bt.classList.remove("show");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  bt.addEventListener("click", (ev) => {
    ev.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    bt.blur();
  });
  // init state in case page was loaded scrolled
  onScroll();
});

// Register service worker when available and in secure context (or localhost)
try {
  if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1")
  ) {
    window.addEventListener("load", () => {
      // try to derive a cache version from package.json to version caches automatically
      let swVersion = null;
      fetch("/package.json")
        .then((r) => r.json())
        .then((pkg) => {
          swVersion =
            pkg && pkg.version ? String(pkg.version) : String(Date.now());
          return navigator.serviceWorker.register(
            "/sw.js?cacheVersion=" + encodeURIComponent(swVersion)
          );
        })
        .catch(() => {
          // fallback: register without version param
          return navigator.serviceWorker.register("/sw.js");
        })
        .then((reg) => {
          console.log("Service worker registered:", reg);
          try {
            showToast && showToast("Offline support enabled");
          } catch (e) {}
          // detect updates and notify the UI (pass the resolved version if available)
          if (reg) attachSWUpdateHandler(reg, swVersion);
        })
        .catch((err) => {
          console.warn("Service worker registration failed:", err);
        });
    });
  }
} catch (e) {}

// Attach update handler to a ServiceWorkerRegistration to notify the page when a new worker is waiting
function attachSWUpdateHandler(reg, incomingVersion) {
  try {
    if (!reg) return;
    // If there's already a waiting worker, show the banner
    if (reg.waiting) {
      showSWUpdateBanner(reg, incomingVersion);
      return;
    }
    // Listen for updates found
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed") {
          // A new worker is installed and waiting
          if (reg.waiting) showSWUpdateBanner(reg, incomingVersion);
        }
      });
    });
  } catch (e) {}
}

function showSWUpdateBanner(reg, incomingVersion) {
  const banner = document.getElementById("sw-update-banner");
  if (!banner) return;
  const msg = document.getElementById("sw-update-msg");
  if (msg) {
    if (incomingVersion)
      msg.textContent = "New version " + incomingVersion + " available.";
    else msg.textContent = "A new version is available.";
  }
  banner.style.display = "";
  banner.classList.add("show");
  const nowBtn = document.getElementById("sw-update-now");
  const laterBtn = document.getElementById("sw-update-later");

  function cleanup() {
    banner.style.display = "none";
    banner.classList.remove("show");
    if (nowBtn) nowBtn.onclick = null;
    if (laterBtn) laterBtn.onclick = null;
  }

  if (nowBtn) {
    nowBtn.onclick = () => {
      // tell the waiting worker to skipWaiting
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    };
  }
  if (laterBtn) {
    laterBtn.onclick = () => cleanup();
  }

  // Listen for controllerchange to reload the page when the new SW takes control
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    function onCtrl() {
      try {
        navigator.serviceWorker.removeEventListener("controllerchange", onCtrl);
      } catch (e) {}
      window.location.reload();
    }
  );
}

/*
 * Lightweight confetti (no deps)
 * showConfetti(originElement, {count, spread, duration})
 */
function showConfetti(originEl, opts) {
  opts = opts || {};
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const count = typeof opts.count === "number" ? opts.count : 40;
  const spread = typeof opts.spread === "number" ? opts.spread : 60; // degrees
  const duration = typeof opts.duration === "number" ? opts.duration : 1400;
  const colors = [
    "#ffb74d",
    "#37b6a7",
    "#4caf50",
    "#90caf9",
    "#ff8a65",
    "#f48fb1",
  ];

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = 99999;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // origin point
  let ox = window.innerWidth / 2;
  let oy = window.innerHeight / 2;
  try {
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      ox = r.left + r.width / 2;
      oy = r.top + r.height / 2;
    }
  } catch (e) {}

  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
    const speed = Math.random() * 6 + 2;
    particles.push({
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed * (Math.random() * 0.8 + 0.6),
      vy:
        Math.sin(angle) * speed * (Math.random() * 0.8 + 0.6) -
        (Math.random() * 4 + 2),
      size: Math.random() * 8 + 6,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 10,
      ttl: duration,
      age: 0,
    });
  }

  let last = performance.now();
  let raf;
  function frame(now) {
    const dt = now - last;
    last = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.ttl) continue;
      alive = true;
      // physics
      p.vy += 0.003 * dt; // gravity-ish
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vx *= 0.998;
      p.vy *= 0.998;
      p.rot += p.vr * (dt / 16);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(frame);
    else cleanup();
  }

  function cleanup() {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    try {
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    } catch (e) {}
  }

  raf = requestAnimationFrame(frame);
  // ensure cleanup in case particles linger
  setTimeout(cleanup, duration + 300);
}

// --- Minigame: Tag Match (simple client-side 30s game) ---
(() => {
  const MG_KEY_HIGH = "canapp_minigame_highscore";
  // derive tag list from demo projects if available, fallback to static set
  function getAllTags() {
    try {
      const fromDemo = Array.isArray(DEMO_PROJECTS)
        ? DEMO_PROJECTS.flatMap((p) => p.advantages || [])
        : [];
      const uniq = Array.from(new Set(fromDemo.filter(Boolean)));
      if (uniq.length) return uniq;
    } catch (e) {}
    return [
      "Nuclear",
      "Cheap Energy",
      "Data Centres",
      "AI / Compute",
      "Methane",
      "Land & Lumber",
      "Resources",
    ];
  }

  const state = {
    running: false,
    score: 0,
    timeLeft: 30,
    timerId: null,
    tags: getAllTags(),
    currentTarget: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function renderHigh() {
    const hs = localStorage.getItem(MG_KEY_HIGH);
    $("mg-high").textContent = hs ? hs : "—";
  }

  function pickTarget() {
    const t = state.tags[Math.floor(Math.random() * state.tags.length)];
    state.currentTarget = t;
    const el = $("mg-target");
    if (el) el.textContent = t || "—";
  }

  function renderButtons() {
    const container = $("mg-buttons");
    if (!container) return;
    container.innerHTML = "";
    // build 5 buttons (1 correct + 4 random)
    const pool = state.tags.slice();
    // ensure target is present
    if (!pool.includes(state.currentTarget)) pool.push(state.currentTarget);
    // shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const choices = pool.slice(0, Math.min(5, pool.length));
    // ensure target in choices
    if (!choices.includes(state.currentTarget)) {
      choices[Math.floor(Math.random() * choices.length)] = state.currentTarget;
    }
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = c;
      b.onclick = () => onChoice(c);
      container.appendChild(b);
    });
  }

  function onChoice(choice) {
    if (!state.running) return;
    if (choice === state.currentTarget) {
      state.score += 1;
      showToast("Correct +1", 900);
    } else {
      state.score = Math.max(0, state.score - 1);
      showToast("Wrong −1", 900);
    }
    const sc = $("mg-score");
    if (sc) sc.textContent = state.score;
    // next round
    pickTarget();
    renderButtons();
  }

  function tick() {
    state.timeLeft -= 1;
    const tEl = $("mg-timer");
    if (tEl) tEl.textContent = state.timeLeft;
    if (state.timeLeft <= 0) {
      endGame();
    }
  }

  function startGame() {
    if (state.running) return;
    state.running = true;
    state.score = 0;
    state.timeLeft = 30;
    const sc = $("mg-score");
    if (sc) sc.textContent = state.score;
    const tEl = $("mg-timer");
    if (tEl) tEl.textContent = state.timeLeft;
    pickTarget();
    renderButtons();
    state.timerId = setInterval(tick, 1000);
    showToast("Game started — go!", 1200);
  }

  function endGame() {
    state.running = false;
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
    showToast("Time up! Score: " + state.score, 2200);
    // persist high score
    try {
      const prev = parseInt(localStorage.getItem(MG_KEY_HIGH) || "0", 10) || 0;
      if (state.score > prev) {
        localStorage.setItem(MG_KEY_HIGH, String(state.score));
        renderHigh();
        showToast("New high score! " + state.score, 2000);
      }
    } catch (e) {}
  }

  function resetHigh() {
    try {
      localStorage.removeItem(MG_KEY_HIGH);
      renderHigh();
      showToast("High score cleared");
    } catch (e) {}
  }

  // wire up UI when present
  document.addEventListener("DOMContentLoaded", () => {
    // only initialize if minigame UI exists
    if (!document.getElementById("minigame-section")) return;
    // try to populate tags from existing advantage chips on pages (if present)
    try {
      const chips = Array.from(document.querySelectorAll(".chip"))
        .map((c) => c.textContent.trim())
        .filter(Boolean);
      if (chips.length)
        state.tags = Array.from(new Set(chips.concat(state.tags)));
    } catch (e) {}
    renderHigh();
    const start = document.getElementById("mg-start");
    if (start) start.onclick = startGame;
    const reset = document.getElementById("mg-reset");
    if (reset) reset.onclick = resetHigh;
    // ensure initial target and buttons ready
    pickTarget();
    renderButtons();
  });
})();
