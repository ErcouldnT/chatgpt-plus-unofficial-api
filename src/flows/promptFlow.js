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
export async function promptWithOptions(page, options, prompt, systemPrompt, images = []) {
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

  // Validate selectors before proceeding
  // We'll trust the plan: input[type="file"]
  if (images && images.length > 0) {
    console.log(`📷 Prepare to upload ${images.length} images...`);
    const tempDir = os.tmpdir();
    const uploadedFilePaths = [];

    try {
      // 1. Download/Save all images
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const ext = img.startsWith("data:image/png") ? ".png" : ".jpg"; // simple heuristic
        const filename = `chatgpt_upload_${Date.now()}_${i}${ext}`;
        const filepath = path.join(tempDir, filename);

        if (img.startsWith("http")) {
          console.log(`   ⬇️ Downloading image ${i + 1}...`);
          await downloadImage(img, filepath);
        }
        else if (img.startsWith("data:")) {
          console.log(`   💾 Saving base64 image ${i + 1}...`);
          const base64Data = img.split(",")[1];
          await saveBase64Image(base64Data, filepath);
        }
        else {
          console.warn(`   ⚠️ Unrecognized image format: ${img.substring(0, 20)}...`);
          continue;
        }
        uploadedFilePaths.push(filepath);
      }

      // 2. Upload to ChatGPT
      if (uploadedFilePaths.length > 0) {
        // Try to find the file input
        console.log("   📤 Uploading to file input...");
        const fileInput = await page.$("input[type='file']");
        if (fileInput) {
          await fileInput.uploadFile(...uploadedFilePaths);
          console.log("   ✅ Upload command sent.");

          // 3. Wait for upload processing (look for thumbnail or some visual indicator)
          // Simple heuristic: wait for the thumbnail container to appear.
          // Usually a div with class 'relative' containing an img or similar inside the composer.
          // We'll give it a few seconds to stabilize.
          await new Promise(r => setTimeout(r, 3000));
        }
        else {
          console.error("   ❌ File input not found! Skipping image upload.");
        }
      }
    }
    catch (err) {
      console.error("   ❌ Image upload failed:", err);
    }
    finally {
      // 4. Cleanup temp files
      for (const p of uploadedFilePaths) {
        try {
          await fs.promises.unlink(p);
        }
        catch (e) { /* ignore */ }
      }
    }
  }

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
        // Check for transient states
        console.log(`🔎 [Stability Check] Text: ${JSON.stringify(text)}`);
        const transientKeywords = ["Analyzing", "Reading", "Creating", "Searching", "Generating", "Thinking"];
        if (transientKeywords.some(keyword => text.startsWith(keyword))) {
          console.log("⏳ Transient state detected. Continuing poll...");
          continue;
        }

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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to download image: ${response.statusText}`);
  await pipeline(response.body, fs.createWriteStream(filepath));
}

async function saveBase64Image(base64Data, filepath) {
  const buffer = Buffer.from(base64Data, "base64");
  await fs.promises.writeFile(filepath, buffer);
}
