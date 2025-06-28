import express from "express";
import { promptWithOptions } from "../flows/promptFlow.js";
import { getBrowser } from "../services/puppeteerServices.js";

// handle login Routes
const promptRouter = express.Router();

// handle POST request for login
promptRouter.post("/", async (req, res) => {
  console.warn("POST:/api/prompt | In prompt post request...");

  // retrieve input passed from client
  const { prompt, options = {} } = req.body; // defaults options to null obj

  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    const response = await promptWithOptions(page, options, prompt);
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
