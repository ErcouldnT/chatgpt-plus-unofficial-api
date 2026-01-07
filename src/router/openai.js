import { randomUUID } from "node:crypto";
import express from "express";
import { promptWithOptions } from "../flows/promptFlow.js";
import { getBrowser } from "../services/puppeteerServices.js";

const openaiRouter = express.Router();

openaiRouter.post("/chat/completions", async (req, res) => {
  console.warn("POST:/v1/chat/completions | Received request");

  try {
    const { messages, model, stream, threadId: bodyThreadId } = req.body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: "'messages' is required and must be a non-empty array.",
          type: "invalid_request_error",
          param: "messages",
          code: null,
        },
      });
    }

    // Extract the prompt from the last user message
    const lastUserMessage = messages.reverse().find(m => m.role === "user");
    if (!lastUserMessage) {
      return res.status(400).json({
        error: {
          message: "No message with role 'user' found.",
          type: "invalid_request_error",
          param: "messages",
          code: null,
        },
      });
    }

    const start = Date.now();
    const prompt = lastUserMessage.content;
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

    console.warn(`Attempting to send prompt to ChatGPT. Model: ${model}, Options:`, options);

    const browser = getBrowser();
    const page = await browser.newPage();

    let result;
    try {
      result = await promptWithOptions(page, options, prompt, systemPrompt);
    } finally {
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
      created: created,
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
        total_tokens: -1
      }
    };

    // If the client requested additional fields (like threadId in root), we could add them,
    // but sticking to spec is safer. The user can look at system_fingerprint.
    // Also adding a custom header for threadId might be useful.
    res.setHeader("X-ChatGPT-Thread-Id", result.threadId || "");

    res.json(response);

  } catch (error) {
    console.error("Error processing OpenAI request:", error);
    res.status(500).json({
      error: {
        message: error.message || "Internal Server Error",
        type: "server_error",
        param: null,
        code: null,
      },
    });
  }
});

export default openaiRouter;
