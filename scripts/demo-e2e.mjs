import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}/`;

const browser = await puppeteer.launch({
  executablePath:
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 860 });

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  console.log("1. Demo gender gate");
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));
  const gateText = await page.evaluate(() => document.body.innerText);
  check("shows Welcome to trendza gate", gateText.includes("Welcome to trendza"));
  check("shows gender options", gateText.includes("Female") && gateText.includes("Male"));

  console.log("2. Pick Female -> enter demo");
  // Click the Female option-card (first gender button) then Enter
  const entered = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const female = btns.find((b) => b.innerText.includes("Female"));
    if (female) female.click();
    return !!female;
  });
  check("found Female button", entered);
  await new Promise((r) => setTimeout(r, 400));
  const enterBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find((x) => x.innerText.includes("Enter the demo"));
    if (b) b.click();
    return !!b;
  });
  check("clicked Enter the demo", enterBtn);
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(()=>{});
  await new Promise((r) => setTimeout(r, 3000));

  const bodyText = await page.evaluate(() => document.body.innerText);
  check("has app header", /Dress Me|Wardrobe|Plan/.test(bodyText));

  console.log("3. Shuffler loads wardrobe items (female = 50)");
  const shuffleImgCount = await page.evaluate(() => {
    return document.querySelectorAll("img[src*='/clothes/']").length;
  });
  check("shuffler renders local garment images", shuffleImgCount >= 3);

  // Navigate to wardrobe tab via URL like the real app
  await page.goto(BASE + "wardrobe", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  const wb = await page.evaluate(() => document.body.innerText);
  check("wardrobe renders", /All|Tops|Bottoms|Shoes/.test(wb));

  // Planner navigates (UI runs offline; generation will show need-backend msg)
  await page.goto(BASE + "planner", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  const pl = await page.evaluate(() => document.body.innerText);
  check("planner renders", /Plan|Outfit|Day/.test(pl));

  console.log("4. Save a look -> Saved tab");
  await page.goto(BASE + "dress-me", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  // Click Save Look on the shuffler
  const saved = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.innerText.includes("Save Look"));
    if (b) b.click();
    return !!b;
  });
  check("found Save Look button", saved);
  // NamePrompt opens pre-filled with a default name — click its Save button.
  await new Promise((r) => setTimeout(r, 700));
  const confirmed = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find(
      (x) => x.innerText.trim() === "Save"
    );
    if (b) b.click();
    return !!b;
  });
  check("confirmed the fit name prompt", confirmed);
  await new Promise((r) => setTimeout(r, 2500));
  await page.goto(BASE + "fits", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  const fitsText = await page.evaluate(() => document.body.innerText);
  check("saved outfit appears in Saved tab", fitsText.includes("My Look") && fitsText.includes("YOUR FITS"));

  console.log("5. Console errors");
  // React logs its (cosmetic) key warnings via console.error; ignore those and
  // genuine network noise, and look only for real uncaught runtime failures.
  const realErrors = consoleErrors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("net::ERR_") &&
      !e.trim().startsWith("Warning:") &&
      !e.includes("reactjs.org/link/warning")
  );
  check("no uncaught runtime errors", realErrors.length === 0);
  if (realErrors.length) {
    console.log("  first errors:", realErrors.slice(0, 5));
  }
} catch (e) {
  fail++;
  console.log("  ✗ exception:", e.message);
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);