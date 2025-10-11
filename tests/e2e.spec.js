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
