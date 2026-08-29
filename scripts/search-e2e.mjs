import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "3001";
const BASE = `http://localhost:${PORT}/`;

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 860 });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  // Enter demo
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => {
    const f = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Female"));
    if (f) f.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.innerText.includes("Enter the demo"));
    if (b) b.click();
  });
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));

  console.log("A. Open web clipper (FAB + -> Clip)");
  await page.goto(BASE + "dress-me", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.getAttribute("aria-label") === "Add to wardrobe");
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  const clickedClip = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.innerText.startsWith("Clip"));
    if (b) b.click();
    return !!b;
  });
  check("clicked Clip action", clickedClip);
  await new Promise((r) => setTimeout(r, 2000));
  const clipText = await page.evaluate(() => document.body.innerText);
  check("clipper renders (Find an Item)", clipText.includes("Find an Item"));

  console.log("B. Search web mode");
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.innerText.includes("Search web"));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const hasInput = await page.evaluate(() => !!document.querySelector("input"));
  check("search input present", hasInput);
  await page.type("input", "black bomber jacket");
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 5000));

  const body = await page.evaluate(() => document.body.innerText);
  const imgCount = await page.evaluate(() => document.querySelectorAll("img").length);
  check("no 'Search failed' / 'needs a real backend'", !body.includes("Search failed") && !body.includes("needs a real backend"));
  check("search grid renders imagery", imgCount > 3);
  check("brand filter row present + results grid", (body.includes("All") && imgCount > 3) || /[A-Za-z].*Bomber/.test(body));
  console.log("  images:", imgCount, "| snippet:", body.replace(/\n+/g, " ").slice(0, 200));

  const realErrors = consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("net::ERR_") && !e.trim().startsWith("Warning:") && !e.includes("reactjs.org/link/warning")
  );
  check("no uncaught runtime errors", realErrors.length === 0);
  if (realErrors.length) console.log("  errors:", realErrors.slice(0, 5));
} catch (e) {
  fail++;
  console.log("  ✗ exception:", e.message);
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);