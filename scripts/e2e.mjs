import run from "../tests/browser.e2e.js";
import runUpdates from "../tests/updates.e2e.js";
const updates = process.argv.includes("--updates");
let playwright;
try { playwright = await import("playwright"); }
catch { console.error("Test browser opzionali: serve Playwright nell’ambiente di sviluppo. I test unitari non richiedono dipendenze."); process.exit(1); }
const kind = process.env.BROWSER ?? "chromium";
if (!["chromium","webkit","firefox"].includes(kind)) throw new Error("Browser non supportato");
const browser = await playwright[kind].launch();
try {
  for (const viewport of [{width:390,height:844},{width:1280,height:900}]) {
    const context = await browser.newContext({viewport,acceptDownloads:true});
    try {
      const page = await context.newPage();
      if (updates) console.log(await runUpdates(page, process.env.TEST_URL ?? "http://localhost:4180/update-test/"));
      else {
        await page.goto(process.env.TEST_URL ?? "http://localhost:4173/");
        console.log(await run(page));
      }
    } finally {await context.close();}
  }
} finally {await browser.close();}
