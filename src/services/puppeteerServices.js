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
      ],
      defaultViewport: null,
    });

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
