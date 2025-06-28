const express = require("express");
const { promptWithOptions } = require("../flows/promptFlow");
const { getBrowser } = require("../services/puppeteerServices");

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
