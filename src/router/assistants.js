// src/router/assistants.js
import express from "express";
import { createThread, getThread, addMessageToThread, listMessages, createRun, getRun } from "../services/store.js";
import { processRun } from "../services/processor.js";

const assistantsRouter = express.Router();

/**
 * 1. MOCK Assistants List/Retrieve
 * Real Assistants API starts with an assistantId. 
 * We mock it because users usually just need a placeholder.
 */
assistantsRouter.get("/assistants", (req, res) => {
    res.json({
        object: "list",
        data: [{ id: "asst_unofficial", object: "assistant", created_at: Date.now(), model: "gpt-4" }]
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

assistantsRouter.get("/threads/:threadId", (req, res) => {
    const thread = getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread);
});

/**
 * 3. MESSAGES
 */
assistantsRouter.post("/threads/:threadId/messages", (req, res) => {
    try {
        const msg = addMessageToThread(req.params.threadId, req.body);
        res.status(201).json(msg);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

assistantsRouter.get("/threads/:threadId/messages", (req, res) => {
    try {
        const messages = listMessages(req.params.threadId);
        res.json({ object: "list", data: messages });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

/**
 * 4. RUNS (The execution part)
 */
assistantsRouter.post("/threads/:threadId/runs", (req, res) => {
    const { assistant_id, model } = req.body;
    const run = createRun(req.params.threadId, assistant_id, model);

    // Trigger async processing
    processRun(run.id);

    res.status(201).json(run);
});

assistantsRouter.get("/threads/:threadId/runs/:runId", (req, res) => {
    const run = getRun(req.params.runId);
    if (!run) return res.status(404).json({ error: "Run not found" });
    res.json(run);
});

export default assistantsRouter;
