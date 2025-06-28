const express = require("express");
const { performLoginWithBasicAuth } = require("../flows/basicLogin");
const { promptWithOptions } = require("../flows/promptFlow");
const { getBrowser } = require("../services/puppeteerServices");
const { isChatGPTLoggedIn } = require("../utils/helpers");

// import logger
const { getLogger } = require("../utils/logger");

const logger = getLogger("prompt.js");

// handle login Routes
const promptRouter = express.Router();

// handle POST request for login
promptRouter.post("/", async (req, res) => {
  logger.debug("POST:/api/prompt", "In prompt post request...");

  // retrieve input passed from client
  const { prompt, options = {} } = req.body; // defaults options to null obj

  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    if (await isChatGPTLoggedIn(page)) {
      logger.debug(
        "POST:/api/prompt",
        "✅ Already signed in — skipping login flow.",
      );
    }
    else {
      logger.debug("POST:/api/prompt", "🔐 Not signed in — running login flow…");
      await performLoginWithBasicAuth(page);
    }

    const response = await promptWithOptions(page, options, prompt);
    res.status(200).json(response);
  }
  catch (err) {
    logger.error("POST:/api/prompt", err);
    res.status(500).json({ error: err.message });
  }
  finally {
    await page.close();
  }
});

module.exports = promptRouter;
