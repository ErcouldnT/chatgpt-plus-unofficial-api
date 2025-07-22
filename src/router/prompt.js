import express from "express";
// import { performLoginWithBasicAuth } from "../flows/basicLogin.js";
import { promptWithOptions } from "../flows/promptFlow.js";
import { getBrowser } from "../services/puppeteerServices.js";
// import { isChatGPTLoggedIn } from "../utils/helpers.js";

// handle login Routes
const promptRouter = express.Router();

// handle POST request for login
promptRouter.post("/", async (req, res) => {
  console.warn("POST:/api/prompt | In prompt post request...");

  // retrieve input passed from client
  const { prompt, options = {}, systemPrompt } = req.body; // defaults options to null obj

  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    // if (await isChatGPTLoggedIn(page)) {
    //   console.warn("✅ Prompt: ", prompt);
    // }
    // else {
    //   console.warn("🔐 Not signed in — running login flow…");
    //   await performLoginWithBasicAuth(page);
    // }

    const response = await promptWithOptions(page, options, prompt, systemPrompt);
    res.status(200).json(response);
  }
  catch (err) {
    console.warn("POST:/api/prompt | ERROR:", err);
    res.status(500).json({ error: err.message });
  }
  finally {
    await page.close();
  }
});

export default promptRouter;
