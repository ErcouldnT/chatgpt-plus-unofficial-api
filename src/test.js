import { Buffer } from "node:buffer";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { performLoginWithBasicAuth } from "./flows/basicLogin.js";
import { promptWithOptions } from "./flows/promptFlow.js";
import { isChatGPTLoggedIn } from "./utils/helpers.js";

dotenv.config();

// Apply stealth plugin to evade bot detection (mimics human-like browser features)
puppeteer.use(StealthPlugin());

/**
 * Main automation routine:
 * 1. Launches Chrome with a persistent user-data directory.
 * 2. Opens ChatGPT and checks login status.
 * 3. Executes login flow only if necessary.
 */
async function openGPT() {
  let browser;
  let page;

  try {
    console.warn("▶️ Launching browser with persistent profile…");

    // -------------------------------------------------------------------------
    // 1) Configure persistent user data
    //
    // We point Puppeteer at a local folder ('chrome-user-data') so that cookies,
    // localStorage, and sessionStorage persist between runs. This prevents
    // a fresh/incognito profile on every start.
    // -------------------------------------------------------------------------
    const userDataDir = path.join(path.resolve(), "chrome-user-data");

    // -------------------------------------------------------------------------
    // 2) Launch Puppeteer
    //
    // - headless: false  → visible browser window for debugging and human-like
    // - userDataDir       → persistent session folder
    // - args              → sandbox and automation flags for compatibility
    // - defaultViewport   → null to use full window dimensions
    // -------------------------------------------------------------------------
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV !== "development",
      userDataDir,
      args: [
        "--no-sandbox", // disable sandbox for local testing
        "--disable-setuid-sandbox", // disable setuid sandbox helper
        "--disable-blink-features=AutomationControlled", // hide automation flag
        `--window-size=1920,540`,
        "--window-position=0,0",
        "--disable-web-security", // allow cross-origin
        "--disable-features=IsolateOrigins,site-per-process", // allow cross-origin
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ],
      ignoreDefaultArgs: ["--enable-automation"], // hide automation flag
      defaultViewport: null,
    });

    console.warn("🔗 Opening new page…");
    page = await browser.newPage();

    let cookies = [];

    try {
      const json = Buffer.from(process.env.COOKIE_JSON_B64, "base64").toString("utf-8");
      cookies = JSON.parse(json);
      console.warn("🍪 Cookies loaded from base64 string");
    }
    catch (err) {
      console.warn("❌ Failed to parse COOKIE_JSON_B64:", err.message);
    }

    if (cookies.length) {
      const context = browser.defaultBrowserContext();
      await context.setCookie(...cookies);
    }
    else {
      console.warn("⚠️ No cookies loaded from COOKIE_JSON; proceeding without them.");
    }

    // await page.setExtraHTTPHeaders({
    //   "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    // });

    // -------------------------------------------------------------------------
    // 3) Authentication check
    //
    // Use our helper to inspect sessionStorage; if not logged in, perform the
    // basic email & pass auth login flow. This avoids unnecessary re-authentication.
    // -------------------------------------------------------------------------
    if (await isChatGPTLoggedIn(page)) {
      console.warn("✅ Already signed in — skipping login flow.");
    }
    else {
      console.warn("🔐 Not signed in — running login flow…");
      await performLoginWithBasicAuth(page);
    }

    // -------------------------------------------------------------------------
    // 4) Send prompt with reuse of existing conversation thread (if any)
    //
    // We pass prompt + optional modes (`search`, `reason`) and the threadId.
    // ChatGPT will continue the conversation in the specified thread if provided.
    // -------------------------------------------------------------------------
    const systemPrompt = null;
    const prompt = "based on researching data who is mustafa kemal ataturk?";
    const options = {
      search: true,
      // reason: true,
      // threadId: '681a6cba-c0fc-8004-977c-f34adf806988'
    };
    const responseObject = await promptWithOptions(page, options, prompt, systemPrompt);
    if (responseObject === null) {
      console.error(
        "❌ No response or valid paragraph response received from ChatGPT.",
      );
      // handle error: retry, exit, default value, etc.
    }
    else {
      const { threadId: returnedThreadId, response } = responseObject;
      console.warn("📬 ChatGPT replied:", response);
      console.warn("📌 Conversation ID:", returnedThreadId);
      // proceed with valid response and potentially save threadId for next run
    }

    console.warn("✅ Automation flow complete.");
  }
  catch (error) {
    // -------------------------------------------------------------------------
    // Error handling: log the error and the last known page URL for debugging
    // -------------------------------------------------------------------------
    console.error("❌ An error occurred in the main process:", error);
    if (page) {
      console.error("Last page URL at error time:", page.url());
    }
  }
  finally {
    // -------------------------------------------------------------------------
    // Finalization: we leave the browser open so you can inspect the session.
    // To close it programmatically, uncomment the line below.
    // -------------------------------------------------------------------------
    console.warn("🏁 Script finished.");
    // await browser?.close();
  }
}

// Kick off the automation
openGPT();
