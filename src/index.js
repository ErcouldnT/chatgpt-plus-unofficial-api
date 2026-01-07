import process from "node:process";
import dotenv from "dotenv";
import express from "express";

import { performLoginWithBasicAuth } from "./flows/basicLogin.js";
import routesHandler from "./routes.js";
import { getBrowser, initializeBrowser } from "./services/puppeteerServices.js";
import { isChatGPTLoggedIn } from "./utils/helpers.js";

dotenv.config();

const server = express();

// app is a middleware fn which is included here i.e. it is used in server but the code is defined else where but we use it here
server.use(routesHandler);

// Create an async function to start the server
async function startServer() {
  try {
    // Initialize Puppeteer browser
    await initializeBrowser();
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      if (await isChatGPTLoggedIn(page)) {
        console.warn("✅ Already signed in — skipping login flow.");
      }
      else {
        console.warn("🔐 Not signed in — running login flow…");
        await performLoginWithBasicAuth(page);
      }
      console.warn("Shared Puppeteer page initialized and authenticated successfully.");
    }
    finally {
      await page.close();
    }
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, "0.0.0.0", () => {
      console.warn(`📺 Server is running on http://0.0.0.0:${PORT}`);
      console.warn(
        "🌐 Puppeteer service is active, browser is ready and authenticated for API routes.\n",
      );
    });
  }
  catch (error) {
    console.error("Failed to initialize Puppeteer, authenticate, or start server:", error);
    process.exit(1); // Exit if critical initialization fails
  }
}

startServer();
