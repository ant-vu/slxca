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
    return;
  }
  $("#user-name").value = pf.name || "";
  $("#user-email").value = pf.email || "";
  $("#role-pref").value = pf.role || "Entrepreneur / Founder";
  $("#user-skills").value = (pf.skills || []).join(", ");
  renderMatches();
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
