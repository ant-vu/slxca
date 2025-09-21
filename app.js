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
  },
  {
    title: "Methane Capture for Grid Stability",
    authors: "L. Chen (McGill)",
    institution: "McGill University",
    abstract:
      "Novel catalytic approach to capture and convert methane emissions into dispatchable energy.",
    advantages: ["Methane", "Resources"],
  },
  {
    title: "Nuclear Microreactors for Distributed Compute",
    authors: "R. Patel (UofT)",
    institution: "University of Toronto",
    abstract:
      "Design and safety models for small modular reactors powering edge data centres.",
    advantages: ["Nuclear", "Cheap Energy", "AI / Compute"],
  },
  {
    title: "Sustainable Lumber Supply Chains",
    authors: "M. Osei (UBC)",
    institution: "University of British Columbia",
    abstract:
      "Blockchain-backed traceability for lumber supply to support sustainable construction.",
    advantages: ["Land & Lumber", "Resources"],
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
  proj.id = "p" + Date.now();
  proj.joiners = [];
  ps.unshift(proj);
  write(LS_KEYS.PROJECTS, ps);
  renderProjects();
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
    )}</div><div class="small">${escapeHtml(p.abstract || "")}</div>`;
    const tags = document.createElement("div");
    tags.className = "tags";
    (p.advantages || []).forEach((a) => {
      const t = document.createElement("div");
      t.className = "tag-chip";
      t.textContent = a;
      tags.appendChild(t);
    });
    left.appendChild(tags);
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
    el.appendChild(left);
    el.appendChild(actions);

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
  card.innerHTML = `<h2>${escapeHtml(
    p.title
  )}</h2><div class="small">${escapeHtml(p.authors || "")} — ${escapeHtml(
    p.institution || ""
  )}</div><p>${escapeHtml(
    p.abstract || ""
  )}</p><div class="small">Strategic: ${(p.advantages || []).join(
    ", "
  )}</div><div style="margin-top:12px" class="small">Joiners: ${
    (p.joiners || []).map((j) => j.name).join(", ") || "—"
  }</div>`;
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
  const svg = `
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
  container.innerHTML = svg;
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
  if (pf.traits) {
    // build project trait vector
    const projTraits = {};
    (p.advantages || []).forEach((a) => {
      const map = ADV_TO_TRAITS[a];
      if (!map) return;
      Object.keys(map).forEach((k) => {
        projTraits[k] = (projTraits[k] || 0) + map[k];
      });
    });
    // normalize and compute simple similarity (inverse Euclidean distance)
    if (Object.keys(projTraits).length) {
      // project trait weights are heuristic integers; convert both sides to normalized 0..1
      const userNorm = pf.traitNormalized || pf.traits || {};
      // first, determine max value in projTraits for normalization
      const maxVal = Math.max(...Object.values(projTraits));
      const dims = Array.from(
        new Set([...Object.keys(userNorm), ...Object.keys(projTraits)])
      );
      let sumSq = 0;
      dims.forEach((d) => {
        const ptRaw = projTraits[d] || 0;
        const pt = maxVal > 0 ? ptRaw / maxVal : 0; // normalize proj trait to 0..1
        const vt = typeof userNorm[d] === "number" ? userNorm[d] : 0.5; // default neutral 0.5
        const diff = vt - pt;
        sumSq += diff * diff;
      });
      const dist = Math.sqrt(sumSq);
      // convert distance to a small bonus (higher when closer). scale: max possible dist sqrt(n)
      const maxDist = Math.sqrt(dims.length);
      const closeness = 1 - Math.min(dist / maxDist, 1); // 0..1
      const traitScore = Math.round(closeness * 6); // up to +6 bonus
      score += traitScore;
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
    saveProject({ title, authors, institution, abstract, advantages });
    $("#paper-form").reset();
    $$("#advantage-chips .chip").forEach((c) => c.classList.remove("active"));
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

  // initial render
  renderProjects();
  renderProfile();
  renderCourses();
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

window._canapp = {
  loadProjects,
  loadProfile,
  loadCourses,
  seedDemo,
  renderProjectsFiltered,
};

init();
