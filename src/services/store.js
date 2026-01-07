// src/services/store.js
import crypto from 'node:crypto';
// Simple in-memory storage for Threads and Runs

const threads = new Map();
const runs = new Map();

/**
 * Creates a new thread
 */
export function createThread(initialMessages = []) {
    const id = `thread_${crypto.randomUUID()}`;
    const thread = {
        id,
        object: "thread",
        created_at: Math.floor(Date.now() / 1000),
        metadata: {},
        messages: [], // Our internal message store
        chatgpt_thread_id: null // To map to real ChatGPT thread
    };
    threads.set(id, thread);

    if (initialMessages && initialMessages.length > 0) {
        initialMessages.forEach(msg => {
            addMessageToThread(id, msg);
        });
    }

    return thread;
}

export function getThread(id) {
    return threads.get(id);
}

export function updateThreadChatGPTId(id, realId) {
    const thread = threads.get(id);
    if (thread) {
        thread.chatgpt_thread_id = realId;
        threads.set(id, thread);
    }
}

/**
 * Adds a message to a thread
 */
export function addMessageToThread(threadId, message, runId = null) {
    const thread = threads.get(threadId);
    if (!thread) throw new Error("Thread not found");

    const msgId = `msg_${crypto.randomUUID()}`;
    const newMsg = {
        id: msgId,
        object: "thread.message",
        created_at: Math.floor(Date.now() / 1000),
        thread_id: threadId,
        role: message.role,
        content: [
            {
                type: "text",
                text: {
                    value: message.content,
                    annotations: []
                }
            }
        ],
        assistant_id: null,
        run_id: runId,
        metadata: {}
    };

    thread.messages.push(newMsg);
    return newMsg;
}

export function listMessages(threadId) {
    const thread = threads.get(threadId);
    if (!thread) throw new Error("Thread not found");
    // OpenAI lists newest first by default in many views, but API default is specific.
    // We'll return all for now.
    return thread.messages;
}

/**
 * Creates a run
 */
export function createRun(threadId, assistantId, model = "gpt-4") {
    const runId = `run_${crypto.randomUUID()}`;
    const run = {
        id: runId,
        object: "thread.run",
        created_at: Math.floor(Date.now() / 1000),
        thread_id: threadId,
        assistant_id: assistantId,
        status: "queued",
        model: model,
        last_error: null
    };
    runs.set(runId, run);
    return run;
}

export function getRun(runId) {
    return runs.get(runId);
}

export function updateRunStatus(runId, status, error = null) {
    const run = runs.get(runId);
    if (run) {
        run.status = status;
        if (error) {
            run.last_error = { code: "server_error", message: error };
            run.failed_at = Math.floor(Date.now() / 1000);
        }
        if (status === 'completed') {
            run.completed_at = Math.floor(Date.now() / 1000);
        }
        runs.set(runId, run);
    }
}
