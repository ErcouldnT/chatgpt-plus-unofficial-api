import express from "express";
// import { performLoginWithBasicAuth } from "../flows/basicLogin.js";
import { promptWithOptions } from "../flows/promptFlow.js";
import { getBrowser } from "../services/puppeteerServices.js";
// import { isChatGPTLoggedIn } from "../utils/helpers.js";

// handle login Routes
const promptRouter = express.Router();

// handle POST request for login
promptRouter.post("/", async (req, res, next) => {
  console.warn("POST:/api/prompt | In prompt post request...");

  // retrieve input passed from client
  const { prompt, options = {}, systemPrompt = process.env.SYSTEM_PROMPT } = req.body; // defaults options to null obj

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const response = await promptWithOptions(page, options, prompt, systemPrompt);
    res.status(200).json(response);
  }
  catch (err) {
    next(err);
  }
  finally {
    await page.close();
  }
});

export default promptRouter;
