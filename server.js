import process from "node:process";
import dotenv from "dotenv";
import express from "express";

import routesHandler from "./routes.js";
import { performLoginWithBasicAuth } from "./src/flows/basicLogin.js";
import { getBrowser, initializeBrowser } from "./src/services/puppeteerServices.js";
import { isChatGPTLoggedIn } from "./src/utils/helpers.js";

dotenv.config();

const server = express();

// app is a middleware fn which is included here i.e. it is used in server but the code is defined else where but we use it here
server.use(routesHandler);

// Create an async function to start the server
async function startServer() {
  try {
    // Initialize Puppeteer browser
    await initializeBrowser();
    const browser = getBrowser();
    const page = await browser.newPage();
    let loggedIn = false;
    try {
      loggedIn = await isChatGPTLoggedIn(page);
      if (!loggedIn) {
        console.warn("Not logged in, performing login...");
        await performLoginWithBasicAuth(page);
        loggedIn = await isChatGPTLoggedIn(page);
        if (!loggedIn) {
          throw new Error("Login failed. Please check credentials.");
        }
        console.warn("Login successful.");
      }
      else {
        console.warn("Already logged in. Skipping login flow.");
      }
    }
    finally {
      await page.close();
    }
    console.warn("Shared Puppeteer page initialized and authenticated successfully.");
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.warn(`📺 Server is running on http://localhost:${PORT}`);
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
