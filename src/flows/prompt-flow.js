// src/flows/prompt-flow.js
// Contains the logic for sending prompts to ChatGPT with optional modes

const { waitForTimeout, extractParagraphContent } = require("../utils/helpers");

/**
 * Sends a prompt to ChatGPT (with “Reason”/“Search” modes), waits for the reply,
 * polls the streaming response until it stabilizes, and returns the final text.
 *
 * @param {import('puppeteer').Page} page    - Puppeteer Page instance
 * @param {{ reason: boolean, search: boolean }} options - Flags to enable modes
 * @param {string} prompt                    - The user’s prompt
 * @returns {Promise<string|null>}           - The completed response text, or null if none received
 */
async function promptWithOptions(page, options, prompt) {
    const { reason, search } = options;

    // Toggle modes if requested
    if (reason) {
        console.log('🔍 Enabling Reason mode...');
        await page.locator('button::-p-aria(Reason)').click();
    }
    if (search) {
        console.log('🔍 Enabling Search mode...');
        await page.locator('button::-p-aria(Search)').click();
    }

    // Prepare and clear editor
    console.log('✏️ Clearing editor...');
    const editor = await page.waitForSelector('#prompt-textarea');
    await editor.click();
    await editor.evaluate(el => {
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
    });

    // Type and submit prompt
    console.log('✏️ Typing and submitting prompt...');
    const promptContext = `return the response to the below prompt in a single string '' wrapped in a <p>{response}</p> tag with no parent div in output. Prompt as follows: `;
    await editor.type(promptContext + prompt);
    await editor.press('Enter');

    // Grab the latest article ID
    console.log('⏳ Waiting briefly for response container to appear…');
    await waitForTimeout(1000);
    const ids = await page.$$eval('article', els => els.map(a => a.dataset.testid));
    const latestId = ids.pop();
    const mdSelector = `article[data-testid="${latestId}"] div.markdown`;

    // Ensure the .markdown div exists
    await page.waitForSelector(mdSelector, { timeout: 15000 });

    // Poll until the text stops changing
    console.log('🕒 Polling response until stable…');
    let previous = '';
    let finalText = null;
    for (let i = 0; i < 60; i++) {              // up to ~30s
        const handle = await page.$(mdSelector);
        const text = handle
            ? await handle.evaluate(el => el.innerText.trim())
            : '';
        console.log(`🕒 Poll #${i + 1}:`, text ? `${text.slice(0, 50)}…` : '[empty]');
        if (text && text === previous) {
            finalText = text;
            break;
        }
        previous = text;
        await waitForTimeout(500);
    }

    if (finalText === null) {
        console.warn('⚠️ Response never stabilized; returning last received text (if any).');
        finalText = previous || null;  // empty string becomes null
    }

    // Only attempt extraction if we actually got something
    const cleaned = extractParagraphContent(finalText);
    if (cleaned === null) {
        console.error('⚠️ Failed to extract <p> content.');
    } else {
        console.log('🎯 Cleaned response:', cleaned);
    }
    return cleaned;  // or return null up the chain
}

module.exports = { promptWithOptions };
