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
  let { reason, search, threadId } = options;

  // Navigate: reuse existing thread or start fresh
  const base = "https://chatgpt.com";
  const url = threadId ? `${base}/c/${threadId}` : base;
  console.warn(`🌐 [promptFlow] Navigating to: ${url}`);
  await page.goto(url, { waitUntil: "load", timeout: 120_000 });

  if (threadId) {
    console.warn("⏳ Waiting for existing thread context...");
    try {
      await page.waitForSelector("div.markdown", { timeout: 15000 });
    } catch (e) {
      console.warn("⚠️ Content wait timeout (may be a new or slow thread)");
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  // Toggle modes (Only on NEW threads)
  if (!threadId && (reason || search)) {
    console.warn("☰ Toggling tools...");
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
    } catch (e) {
      console.warn("⚠️ Tool toggle failed, continuing with defaults.");
    }
  }

  // Wait for editor to be ready
  const editor = await page.waitForSelector("#prompt-textarea");

  // Focus and wait for stability
  await editor.click();
  await new Promise(r => setTimeout(r, 2000));

  // Clear editor for new threads
  if (!threadId) {
    console.warn("✏️ Clearing editor...");
    await editor.evaluate((el) => {
      el.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("delete", false, null);
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Type and submit prompt
  console.warn("✏️ Typing and submitting prompt...");
  const finalPrompt = systemPrompt ? `${systemPrompt} | Prompt: ${prompt}` : prompt;

  await editor.type(finalPrompt);
  await editor.press("Enter");

  // Grab the latest article ID
  console.warn("⏳ Waiting briefly for response container to appear…");
  await waitForTimeout(1000);
  const ids = await page.$$eval("article", els =>
    els.map(a => a.dataset.testid));
  const latestId = ids.pop();
  const mdSelector = `article[data-testid="${latestId}"] div[data-message-author-role="assistant"] div.markdown`;

  // Ensure the .markdown div exists
  await page.waitForSelector(mdSelector, { timeout: 600_000 }); // wait to response container for 10 minutes or 600 secs

  // Poll until the text stops changing
  console.warn("🕒 Polling response until stable…");
  let previous = "";
  let finalText = null;

  const POLL_LIMIT = reason ? 600 : 300; // if reason mode poll for 10min else poll for 5min

  for (let i = 0; i < POLL_LIMIT; i++) {
    // polls up to POLL_LIMIT to account for streaming response
    // get text content from the response container
    const handle = await page.$(mdSelector);
    const text = handle
      ? await handle.evaluate(el => el.textContent.trim())
      : "";

    console.warn(
      `🕒 Poll #${i + 1}:`,
      text ? `${text.slice(0, 50)}…` : "[empty]",
    );

    if (text && text === previous) {
      // break the polling if the entire response is returned
      finalText = text;
      break;
    }
    previous = text;
    await waitForTimeout(1000); // wait for 1 sec before polling the next time
  }

  if (finalText === null) {
    console.warn(
      "⚠️ Response never stabilized; returning last received text (if any).",
    );
    finalText = previous || null; // empty string becomes null
  }

  // parse text from html content
  const cleaned = htmlResponseToText(finalText);

  if (cleaned === null) {
    console.warn(
      "⚠️ Failed to parse text content form HTML.",
    );
  }
  else {
    console.warn(
      "🎯 Cleaned response:",
      `${cleaned.slice(0, 50)}....`,
    );
  }

  // After the prompt, re-capture the actual thread from the URL
  const currentUrl = page.url();
  const match = currentUrl.match(/\/c\/([0-9a-f\-]+)/);
  const newThreadId = match ? match[1] : null;
  console.warn(`Resolved threadId: ${newThreadId} (Full URL: ${currentUrl})`);

  return {
    threadId: newThreadId,
    systemPrompt,
    prompt,
    options,
    response: finalText,
    cleanedResponse: cleaned,
  };
}
