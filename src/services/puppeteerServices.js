import { Buffer } from "node:buffer";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

dotenv.config();

puppeteer.use(StealthPlugin());

let browserInstance = null;

export async function initializeBrowser() {
  if (!browserInstance) {
    console.warn("▶️ Launching browser with persistent profile…");

    const userDataDir = path.join(path.resolve(), "chrome-user-data");

    const windowWidth = 1920; // Example: Full HD width
    const windowHeight = 540; // Example: Half of Full HD height

    browserInstance = await puppeteer.launch({
      headless: process.env.NODE_ENV !== "development",
      userDataDir,
      args: [
        "--no-sandbox", // disable sandbox for local testing
        "--disable-setuid-sandbox", // disable setuid sandbox helper
        "--disable-blink-features=AutomationControlled", // hide automation flag
        `--window-size=${windowWidth},${windowHeight}`,
        "--window-position=0,0",
        "--disable-web-security", // allow cross-origin
        "--disable-features=IsolateOrigins,site-per-process", // allow cross-origin
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ],
      ignoreDefaultArgs: ["--enable-automation"], // hide automation flag
      defaultViewport: null,
    });

    // Load cookies from COOKIE_JSON_B64 env and set them in the browser context
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
      const context = browserInstance.defaultBrowserContext();
      await context.setCookie(...cookies);
    }
    else {
      console.warn("⚠️ No cookies loaded from COOKIE_JSON; proceeding without them.");
    }

    console.warn("⏳ Waiting 5 seconds for browser to stabilize...");
    await new Promise(r => setTimeout(r, 5000));
    console.warn("Puppeteer browser initialized.");
  }
  return browserInstance;
}

export function getBrowser() {
  if (!browserInstance) {
    throw new Error(
      "Browser has not been initialized. Call initializeBrowser() first, typically at server startup.",
    );
  }
  return browserInstance;
}

export async function closeBrowser() {
  if (browserInstance) {
    console.warn("Closing browser...");
    await browserInstance.close();
    browserInstance = null;
  }
}
