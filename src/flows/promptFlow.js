// src/flows/promptFlow.js
// Contains the logic for sending prompts to ChatGPT with optional modes
import { htmlResponseToText, waitForTimeout } from "../utils/helpers.js";

/**
 * Sends a prompt to ChatGPT (with “Reason”/“Search” modes), waits for the reply,
 * polls the streaming response until it stabilizes, and returns the final text.
 *
 * @param {import('puppeteer').Page} page    - Puppeteer Page instance
 * @param {{ reason: boolean, search: boolean, threadId: string | null  }}  options - Configuration flags: 1) `reason` to enable Reason mode, 2) `search` to enable Search mode, and 3) optional `threadId` to reuse an existing conversation thread
 * @param {string} prompt                    - The user’s prompt
 * @returns {Promise<string|null>}           - The completed response text, or null if none received
 */
export async function promptWithOptions(page, options, prompt, systemPrompt) {
  const { reason, threadId } = options;

  // Navigate: reuse existing thread or start fresh
  const base = "https://chatgpt.com";
  const url = threadId ? `${base}/c/${threadId}` : base;
  console.log(`🌐 [promptFlow] Navigating to: ${url}`);
  await page.goto(url, { waitUntil: "load", timeout: 120_000 });

  if (threadId) {
    console.log("⏳ Waiting for existing thread context...");
    try {
      await page.waitForSelector("div.markdown", { timeout: 15000 });
    }
    catch {
      console.log("⚠️ Content wait timeout (may be a new or slow thread)");
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  /*
  // Toggle modes (Only on NEW threads)
  if (!threadId && (reason || search)) {
    console.log("☰ Toggling tools...");
    try {
      await page.waitForSelector("button::-p-aria(Choose tool)");
      await page.locator("button::-p-aria(Choose tool)").click();
      if (reason) {
        await page.locator("div::-p-text(Think)").click();
        search = false;
      }
      if (search) {
        await page.locator("div::-p-text(Search)").click();
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    catch (e) {
      console.log("⚠️ Tool toggle failed, continuing with defaults.");
    }
  }
  */

  // Wait for editor to be ready
  const editor = await page.waitForSelector("#prompt-textarea");

  // Focus and wait for stability
  await editor.click();
  await new Promise(r => setTimeout(r, 2000));

  // Clear editor for new threads
  if (!threadId) {
    console.log("✏️ Clearing editor...");
    await editor.evaluate((el) => {
      el.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("delete", false, null);
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Type and submit prompt
  console.log("✏️ Typing and submitting prompt...");
  const finalPrompt = systemPrompt ? `${systemPrompt} | Prompt: ${prompt}` : prompt;

  await editor.type(finalPrompt);
  await editor.press("Enter");

  // Grab the latest article ID
  console.log("⏳ Waiting briefly for response container to appear…");
  await waitForTimeout(1000);
  const ids = await page.$$eval("article", els =>
    els.map(a => a.dataset.testid).filter(id => !!id));
  const latestId = ids.pop();

  // Primary selector using the latest article ID, fallback to last assistant message
  const mdSelector = latestId
    ? `article[data-testid="${latestId}"] div[data-message-author-role="assistant"] div.markdown`
    : `article:last-of-type div[data-message-author-role="assistant"] div.markdown`;

  const thinkingSelector = latestId
    ? `article[data-testid="${latestId}"] div.mb-2.last\\:mb-0`
    : `article:last-of-type div.mb-2.last\\:mb-0`;

  const errorSelector = "div.text-red-500, div.bg-red-500, .alert-error";

  // Ensure the .markdown div or a thinking indicator exists
  console.log(`⏳ Waiting for response container (${mdSelector})…`);
  try {
    await page.waitForSelector(`${mdSelector}, ${thinkingSelector}`, { timeout: 60_000 });
  }
  catch (e) {
    console.log("⚠️ Initial response container not found within 60s. Continuing to poll anyway.");
  }

  // Poll until the text stops changing
  console.log("🕒 Polling response until stable…");
  let previous = "";
  let finalText = null;
  let emptyPollCount = 0;
  const MAX_EMPTY_POLLS = reason ? 120 : 60; // Allow more empty polls for reasoning mode

  const POLL_LIMIT = reason ? 600 : 300; // if reason mode poll for 10min else poll for 5min

  for (let i = 0; i < POLL_LIMIT; i++) {
    // Check for obvious UI errors
    const errorExists = await page.$(errorSelector);
    if (errorExists) {
      const errorText = await errorExists.evaluate(el => el.textContent.trim());
      console.log(`❌ ChatGPT error detected: ${errorText}`);
      break;
    }

    // Check for thinking state
    const isThinking = await page.$(thinkingSelector);

    // get text content from the response container
    const handle = await page.$(mdSelector);
    const text = handle
      ? await handle.evaluate(el => el.textContent.trim())
      : "";

    if (!text) {
      emptyPollCount++;
      const statusMessage = isThinking ? "[thinking...]" : "[empty]";
      console.log(`🕒 Poll #${i + 1}: ${statusMessage}`);

      if (emptyPollCount >= MAX_EMPTY_POLLS && !isThinking) {
        console.log("⚠️ Too many empty polls without thinking state. Exiting.");
        break;
      }
    }
    else {
      emptyPollCount = 0; // reset if we actually got text
      console.log(
        `🕒 Poll #${i + 1}:`,
        `${text.slice(0, 50).replace(/\n/g, " ")}…`,
      );

      if (text === previous) {
        // break the polling if the entire response is returned and stabilized
        finalText = text;
        break;
      }
    }

    previous = text;
    await waitForTimeout(1000); // wait for 1 sec before polling the next time
  }

  if (finalText === null) {
    console.log(
      "⚠️ Response never stabilized; returning last received text (if any).",
    );
    finalText = previous || null; // empty string becomes null
  }

  // parse text from html content
  const cleaned = htmlResponseToText(finalText);

  if (cleaned === null || cleaned === "") {
    console.log(
      "⚠️ Failed to parse text content from HTML or response was empty.",
    );
  }
  else {
    console.log(
      "🎯 Cleaned response captured.",
    );
  }

  // After the prompt, re-capture the actual thread from the URL
  const currentUrl = page.url();
  const match = currentUrl.match(/\/c\/([0-9a-f\-]+)/);
  const newThreadId = match ? match[1] : null;
  console.log(`Resolved threadId: ${newThreadId} (Full URL: ${currentUrl})`);

  return {
    threadId: newThreadId,
    systemPrompt,
    prompt,
    options,
    response: finalText,
    cleanedResponse: cleaned,
  };
}
