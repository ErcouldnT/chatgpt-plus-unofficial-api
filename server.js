require("dotenv").config();
const process = require("node:process");
const express = require("express");

const server = express();

// we require app.js as it handles all the routes
const routesHandler = require("./routes");
const { initializePage } = require("./src/services/puppeteerServices");

// app is a middleware fn which is included here i.e. it is used in server but the code is defined else where but we use it here
server.use(routesHandler);

// Create an async function to start the server
async function startServer() {
  try {
    // Initialize Puppeteer and the shared page before the server starts listening
    await initializePage();
    console.warn("Shared Puppeteer page initialized successfully.");

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.warn(`📺 Server is running on http://localhost:${PORT}`);
      console.warn(
        "🌐 Puppeteer service is active and page is ready for use by API routes.\n",
      );
    });
  }
  catch (error) {
    console.error("Failed to initialize Puppeteer or start server:", error);
    process.exit(1); // Exit if critical initialization fails
  }
}

startServer();
