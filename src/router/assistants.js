// src/router/assistants.js
import express from "express";
import { processRun } from "../services/processor.js";
import { addMessageToThread, createRun, createThread, getRun, getThread, listMessages } from "../services/store.js";
import { AppError } from "../utils/errors.js";

const assistantsRouter = express.Router();

/**
 * 1. MOCK Assistants List/Retrieve
 * Real Assistants API starts with an assistantId.
 * We mock it because users usually just need a placeholder.
 */
assistantsRouter.get("/assistants", (req, res) => {
  res.json({
    object: "list",
    data: [{ id: "asst_unofficial", object: "assistant", created_at: Date.now(), model: "gpt-4" }],
  });
});

assistantsRouter.get("/assistants/:id", (req, res) => {
  res.json({ id: req.params.id, object: "assistant", created_at: Date.now(), model: "gpt-4" });
});

/**
 * 2. THREADS
 */
assistantsRouter.post("/threads", (req, res) => {
  const messages = req.body && req.body.messages ? req.body.messages : [];
  const thread = createThread(messages);
  res.status(201).json(thread);
});

assistantsRouter.get("/threads/:threadId", (req, res, next) => {
  try {
    const thread = getThread(req.params.threadId);
    if (!thread)
      throw new AppError("Thread not found", 404, "invalid_request_error");
    res.json(thread);
  }
  catch (err) {
    next(err);
  }
});

/**
 * 3. MESSAGES
 */
assistantsRouter.post("/threads/:threadId/messages", (req, res, next) => {
  try {
    const msg = addMessageToThread(req.params.threadId, req.body);
    res.status(201).json(msg);
  }
  catch (err) {
    next(err);
  }
});

assistantsRouter.get("/threads/:threadId/messages", (req, res, next) => {
  try {
    const messages = listMessages(req.params.threadId);
    res.json({ object: "list", data: messages });
  }
  catch (err) {
    next(err);
  }
});

/**
 * 4. RUNS (The execution part)
 */
assistantsRouter.post("/threads/:threadId/runs", (req, res, next) => {
  try {
    const { assistant_id, model } = req.body;
    const run = createRun(req.params.threadId, assistant_id, model);

    // Trigger async processing
    processRun(run.id);

    res.status(201).json(run);
  }
  catch (err) {
    next(err);
  }
});

assistantsRouter.get("/threads/:threadId/runs/:runId", (req, res, next) => {
  try {
    const run = getRun(req.params.runId);
    if (!run)
      throw new AppError("Run not found", 404, "invalid_request_error");
    res.json(run);
  }
  catch (err) {
    next(err);
  }
});

export default assistantsRouter;
