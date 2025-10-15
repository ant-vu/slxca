// Simple static prototype app.js — stores data in localStorage
const LS_KEYS = {
  PROJECTS: "canproj_projects",
  PROFILE: "canproj_profile",
  COURSES: "canproj_courses",
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

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || null;
  } catch (e) {
    return null;
  }
}
function write(key, v) {
  localStorage.setItem(key, JSON.stringify(v));
}

// Projects (papers)
function loadProjects() {
  let p = read(LS_KEYS.PROJECTS);
  if (!p) {
    p = [];
    write(LS_KEYS.PROJECTS, p);
  }
  return p;
}
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

function deleteProject(id) {
  if (!confirm("Delete this project? This cannot be undone.")) return;
  const ps = loadProjects();
  const out = ps.filter((p) => p.id !== id);
  write(LS_KEYS.PROJECTS, out);
  renderProjects();
}

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

// Profile
function loadProfile() {
  let pf = read(LS_KEYS.PROFILE);
  if (!pf) {
    pf = null;
  }
  return pf;
}
function saveProfile(pf) {
  write(LS_KEYS.PROFILE, pf);
  renderProfile();
}
function clearProfile() {
  localStorage.removeItem(LS_KEYS.PROFILE);
  renderProfile();
}

// Courses
function loadCourses() {
  let c = read(LS_KEYS.COURSES);
  if (!c) {
    c = SAMPLE_COURSES;
    write(LS_KEYS.COURSES, c);
  }
  return c;
}
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

function renderProjectsFiltered(opts) {
  opts = opts || {};
  const list = $("#projects-list");
  if (!list) return;
  list.innerHTML = "";
  const projects = loadProjects();
  const filtered = projects.filter((p) => {
    if (opts.stage && opts.stage.trim()) {
      if ((p.stage || "").toLowerCase() !== opts.stage.trim().toLowerCase())
        return false;
    }
    if (opts.advantage && opts.advantage.trim()) {
      const adv = opts.advantage.trim().toLowerCase();
      if (!(p.advantages || []).map((a) => a.toLowerCase()).includes(adv))
        return false;
    }
    if (opts.text && opts.text.trim()) {
      const t = opts.text.trim().toLowerCase();
      if (
        !(
          (p.title || "").toLowerCase().includes(t) ||
          (p.abstract || "").toLowerCase().includes(t) ||
          (p.authors || "").toLowerCase().includes(t)
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

// Seed demo data (writes projects, courses, and roles if requested)
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

function showProjectDetails(p) {
  const modal = document.createElement("div");
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
  detailsHtml += `<div style="margin-top:12px" class="small">Joiners: ${
    (p.joiners || []).map((j) => j.name).join(", ") || "—"
  }</div>`;
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
  const close = document.createElement("button");
  close.className = "btn";
  close.textContent = "Close";
  close.onclick = () => document.body.removeChild(modal);
  card.appendChild(close);
  modal.appendChild(card);
  document.body.appendChild(modal);
}

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

// build a radar SVG string from normalized trait values (0..1)
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

// build an overlay radar: user polygon (green) and project polygon (orange)
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
function escapeHtml(s) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

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

  // initial render
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
  if (icon) {
    icon.style.transform = "scale(0.86)";
    setTimeout(() => (icon.style.transform = ""), 220);
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
};

init();
