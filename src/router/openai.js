import { randomUUID } from "node:crypto";
import process from "node:process";
import express from "express";
import { promptWithOptions } from "../flows/promptFlow.js";
import { getBrowser } from "../services/puppeteerServices.js";
import { AppError } from "../utils/errors.js";

const openaiRouter = express.Router();

/**
 * 1. GET /v1/models (Required for n8n/standard clients validation)
 */
openaiRouter.get("/models", (req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "gpt-4", object: "model", created: 1687882411, owned_by: "openai" },
      { id: "gpt-4o", object: "model", created: 1715367049, owned_by: "openai" },
      { id: "gpt-3.5-turbo", object: "model", created: 1677610602, owned_by: "openai" },
      { id: "o1", object: "model", created: 1726127435, owned_by: "openai" },
      { id: "gpt-5", object: "model", created: 1735689600, owned_by: "openai" },
      { id: "reason", object: "model", created: 1726127435, owned_by: "openai" },
      { id: "search", object: "model", created: 1730383180, owned_by: "openai" },
    ],
  });
});

/**
 * 2. GET /v1/ (Consistent with OpenAI's 'Invalid URL' response for root)
 */
openaiRouter.get("/", (req, res) => {
  res.status(404).json({
    error: {
      message: "Invalid URL (GET /v1/)",
      type: "invalid_request_error",
      param: null,
      code: null,
    },
  });
});

/**
 * 3. POST /v1/chat/completions
 */
openaiRouter.post("/chat/completions", async (req, res, next) => {
  console.log("POST:/v1/chat/completions | Received request");

  try {
    const { messages, model, threadId: bodyThreadId } = req.body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new AppError("'messages' is required and must be a non-empty array.", 400, "invalid_request_error", "messages");
    }

    // Extract the prompt and images from the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) {
      throw new AppError("No message with role 'user' found.", 400, "invalid_request_error", "messages");
    }

    let prompt = "";
    const images = [];

    if (Array.isArray(lastUserMessage.content)) {
      for (const part of lastUserMessage.content) {
        if (part.type === "text") {
          prompt += `${part.text}\n`;
        }
        else if (part.type === "image_url") {
          images.push(part.image_url.url);
        }
      }
      prompt = prompt.trim();
    }
    else {
      prompt = lastUserMessage.content;
    }

    const systemPromptMessage = messages.find(m => m.role === "system");
    const systemPrompt = systemPromptMessage ? systemPromptMessage.content : process.env.SYSTEM_PROMPT;

    // Map model to capabilities
    // format: o1 -> reason: true
    // default: reason: false, search: false
    const options = {
      reason: model?.includes("o1") || model?.includes("reason") || false,
      search: model?.includes("search") || model?.includes("web") || false,
      // Allow passing threadId via body (n8n friendly)
      threadId: bodyThreadId || undefined,
    };

    console.log(`Attempting to send prompt to ChatGPT. Model: ${model}, Options:`, options);

    const browser = await getBrowser();
    const page = await browser.newPage();

    let result;
    try {
      result = await promptWithOptions(page, options, prompt, systemPrompt, images);
    }
    finally {
      await page.close();
    }

    // response is { response: string, cleanedResponse: string, threadId: string, ... }

    // Construct standard OpenAI response
    const completionId = `chatcmpl-${randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);

    // We use cleanedResponse for better text parsing, or response if cleaned is null
    const finalContent = result.cleanedResponse || result.response || "";

    const response = {
      id: completionId,
      object: "chat.completion",
      created,
      model: model || "gpt-4-unofficial",
      system_fingerprint: result.threadId, // Return threadId here so client can see it
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: finalContent,
          },
          logprobs: null,
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: -1, // Not calculated
        completion_tokens: -1,
        total_tokens: -1,
      },
    };

    // If the client requested additional fields (like threadId in root), we could add them,
    // but sticking to spec is safer. The user can look at system_fingerprint.
    // Also adding a custom header for threadId might be useful.
    res.setHeader("X-ChatGPT-Thread-Id", result.threadId || "");

    res.json(response);
  }
  catch (error) {
    next(error);
  }
});

export default openaiRouter;
