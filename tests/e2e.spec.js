const { test, expect } = require("@playwright/test");

test("smoke: seed, profile, join, stage filter", async ({ page }) => {
  // open the app index
  await page.goto("/index.html");
  await page.waitForFunction(() => !!window._canapp);

  // 1) Seed demo and verify projects
  await page.evaluate(() => window._canapp.seedDemo(true));
  const projects = await page.evaluate(() => window._canapp.loadProjects());
  expect(projects.length).toBeGreaterThan(0);

  // 2) Save a profile using the UI
  await page.fill("#user-name", "Playwright Tester");
  await page.fill("#user-email", "pw@test.example");
  await page.selectOption("#role-pref", { label: "Engineer / Technical Lead" });
  await page.fill("#user-skills", "hydro, data");
  await page.click('#profile-form button[type="submit"]');

  // verify profile saved
  const profile = await page.evaluate(() => window._canapp.loadProfile());
  expect(profile).not.toBeNull();
  expect(profile.email).toBe("pw@test.example");

  // 3) Join first project
  const first = (await page.evaluate(() => window._canapp.loadProjects()))[0];
  const joined = await page.evaluate((id) => {
    const pf = window._canapp.loadProfile();
    // joinProject is defined as a global function in the app; call it directly
    return window.joinProject ? window.joinProject(id, pf) : false;
  }, first.id);
  expect(joined).toBeTruthy();

  // 4) Filter by stage on projects page
  await page.goto("/projects.html");
  await page.waitForFunction(() => !!window._canapp);
  const stage = await page.evaluate(() => {
    const p = window._canapp.loadProjects()[0];
    return p && p.stage;
  });
  if (stage) {
    await page.selectOption("#filter-stage", { label: stage });
    // ensure select has expected value
    const selected = await page.$eval("#filter-stage", (el) => el.value);
    expect(selected).toBe(stage);
  }
});

test("owner: remove joiner via window._canapp.removeJoiner", async ({
  page,
}) => {
  // open the app
  await page.goto("/index.html");
  await page.waitForFunction(() => !!window._canapp);

  // seed demo to ensure projects exist
  await page.evaluate(() => window._canapp.seedDemo(true));
  const first = await page.evaluate(() => window._canapp.loadProjects()[0]);
  expect(first).toBeTruthy();

  // set profile to the project's owner so owner-only actions are allowed
  const ownerEmail = first.ownerEmail || "owner@example.test";
  const ownerName = first.ownerName || "Owner";
  await page.fill("#user-name", ownerName);
  await page.fill("#user-email", ownerEmail);
  await page.click('#profile-form button[type="submit"]');

  // add a temporary joiner via joinProject (global helper)
  const joiner = { name: "Temp Joiner", email: "temp.joiner@example.test" };
  const joined = await page.evaluate(
    (pid, j) => {
      const pf = j;
      return window.joinProject ? window.joinProject(pid, pf) : false;
    },
    first.id,
    joiner
  );
  expect(joined).toBeTruthy();

  // ensure joiner is present
  const hasJoiner = await page.evaluate(
    (pid, email) => {
      const p = window._canapp.loadProjects().find((x) => x.id === pid);
      return (p.joiners || []).some((jj) => jj.email === email);
    },
    first.id,
    joiner.email
  );
  expect(hasJoiner).toBe(true);

  // accept the confirm dialog that removeJoiner shows
  page.once("dialog", (dialog) => dialog.accept());

  // call removeJoiner exposed on window._canapp
  const removed = await page.evaluate(
    (pid, email) => {
      return window._canapp && window._canapp.removeJoiner
        ? window._canapp.removeJoiner(pid, email)
        : false;
    },
    first.id,
    joiner.email
  );
  expect(removed).toBeTruthy();

  // verify joiner no longer present
  const stillHas = await page.evaluate(
    (pid, email) => {
      const p = window._canapp.loadProjects().find((x) => x.id === pid);
      return (p.joiners || []).some((jj) => jj.email === email);
    },
    first.id,
    joiner.email
  );
  expect(stillHas).toBe(false);
});
