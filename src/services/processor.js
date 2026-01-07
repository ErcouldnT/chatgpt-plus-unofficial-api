// src/services/processor.js
import { getThread, getRun, updateRunStatus, addMessageToThread, updateThreadChatGPTId } from "./store.js";
import { getBrowser } from "./puppeteerServices.js";
import { promptWithOptions } from "../flows/promptFlow.js";

/**
 * Processes a Run asynchronously.
 * In a real queue system, this would be a worker.
 * Here we just trigger it properly.
 */
export async function processRun(runId) {
    const run = getRun(runId);
    if (!run) return;

    // 1. Set to in_progress
    updateRunStatus(runId, "in_progress");

    try {
        const thread = getThread(run.thread_id);
        if (!thread) throw new Error("Thread not found");

        // 2. Find the last user message to use as prompt
        // (Simplification: we assume the last message in the thread is the prompt from the user)
        const lastMessage = thread.messages[thread.messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
            // Nothing to do? or maybe just continue conversation?
            // For now, assume strict turn-taking
        }

        const prompt = lastMessage ? lastMessage.content[0].text.value : "continue";

        // 3. Prepare options
        const options = {
            reason: run.model.includes('reason') || run.model.includes('o1'),
            search: run.model.includes('search') || run.model.includes('web'),
            threadId: thread.chatgpt_thread_id // Use the real ChatGPT thread ID if we have it
        };

        console.log(`[Processor] Processing run ${runId} | prompt: "${prompt}" | threadId: ${options.threadId || 'NEW'}`);

        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
            // 4. Execute Prompt
            const result = await promptWithOptions(page, options, prompt, process.env.SYSTEM_PROMPT);

            // 5. Update Thread Context
            if (result.threadId) {
                updateThreadChatGPTId(thread.id, result.threadId);
            }

            // 6. Add Assistant Response to Thread
            addMessageToThread(thread.id, {
                role: "assistant",
                content: result.cleanedResponse || result.response
            }, runId);

            // 7. Complete Run
            updateRunStatus(runId, "completed");

        } catch (err) {
            console.error("Run Execution Failed:", err);
            updateRunStatus(runId, "failed", err.message);
        } finally {
            await page.close();
        }

    } catch (error) {
        console.error("Processor System Error:", error);
        updateRunStatus(runId, "failed", error.message);
    }
}
