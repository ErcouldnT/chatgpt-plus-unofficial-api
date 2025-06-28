require("dotenv").config();
const path = require("node:path");
const process = require("node:process");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

let browserInstance = null;

async function initializeBrowser() {
  if (!browserInstance) {
    console.warn("▶️ Launching browser with persistent profile…");

    const userDataDir = path.join(__dirname, "..", "..", "chrome-user-data");

    const windowWidth = 1920; // Example: Full HD width
    const windowHeight = 540; // Example: Half of Full HD height

    browserInstance = await puppeteer.launch({
      headless: process.env.NODE_ENV !== "development",
      userDataDir,
      args: [
        "--no-sandbox", // disable sandbox for local testing
        "--disable-setuid-sandbox", // disable setuid sandbox helper
        "--disable-blink-features=AutomationControlled", // hide automation flag
        `--window-size=${windowWidth},${windowHeight}`, // Set window size
        "--window-position=0,0", // Set window position to top-left
      ],
      defaultViewport: null,
    });

    console.warn("Puppeteer browser initialized.");
  }
  return browserInstance;
}

function getBrowser() {
  if (!browserInstance) {
    throw new Error(
      "Browser has not been initialized. Call initializeBrowser() first, typically at server startup.",
    );
  }
  return browserInstance;
}

async function closeBrowser() {
  if (browserInstance) {
    console.warn("Closing browser...");
    await browserInstance.close();
    browserInstance = null;
  }
}

module.exports = {
  initializeBrowser,
  getBrowser,
  closeBrowser,
};
