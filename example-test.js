// index.js
// Entry point for ChatGPT automation: launches a persistent browser session,
// checks authentication, and runs a login flow if needed.

require('dotenv').config(); // Load environment variables from .env file (if any)

const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { performLoginWithBasicAuth } = require('./src/flows/basic-login.js');
const { isChatGPTLoggedIn } = require('./src/utils/helpers.js');
const { promptWithOptions } = require('./src/flows/prompt-flow.js');

// Apply stealth plugin to evade bot detection (mimics human-like browser features)
puppeteer.use(StealthPlugin());

/**
 * Main automation routine:
 * 1. Launches Chrome with a persistent user-data directory.
 * 2. Opens ChatGPT and checks login status.
 * 3. Executes login flow only if necessary.
 */
async function openGPT() {
    let browser;
    let page;

    try {
        console.log('▶️ Launching browser with persistent profile…');

        // -------------------------------------------------------------------------
        // 1) Configure persistent user data
        //
        // We point Puppeteer at a local folder ('chrome-user-data') so that cookies,
        // localStorage, and sessionStorage persist between runs. This prevents
        // a fresh/incognito profile on every start.
        // -------------------------------------------------------------------------
        const userDataDir = path.join(__dirname, 'chrome-user-data');

        // -------------------------------------------------------------------------
        // 2) Launch Puppeteer
        //
        // - headless: false  → visible browser window for debugging and human-like
        // - userDataDir       → persistent session folder
        // - args              → sandbox and automation flags for compatibility
        // - defaultViewport   → null to use full window dimensions
        // -------------------------------------------------------------------------
        browser = await puppeteer.launch({
            headless: false,
            userDataDir,
            args: [
                '--no-sandbox',                         // disable sandbox for local testing
                '--disable-setuid-sandbox',             // disable setuid sandbox helper
                '--disable-blink-features=AutomationControlled', // hide automation flag
            ],
            defaultViewport: null,
        });

        console.log('🔗 Opening new page…');
        page = await browser.newPage();

        // -------------------------------------------------------------------------
        // 3) Navigate to ChatGPT
        //
        // Use the canonical URL; this will redirect to login or the chat interface
        // depending on authentication state.
        // -------------------------------------------------------------------------
        await page.goto('https://chatgpt.com');
        console.log('🌐 Navigated to chatgpt.com');

        // -------------------------------------------------------------------------
        // 4) Authentication check
        //
        // Use our helper to inspect sessionStorage; if not logged in, perform the
        // basic email & pass auth login flow. This avoids unnecessary re-authentication.
        // -------------------------------------------------------------------------
        if (await isChatGPTLoggedIn(page)) {
            console.log('✅ Already signed in — skipping login flow.');
        } else {
            console.log('🔐 Not signed in — running login flow…');
            await performLoginWithBasicAuth(page);
        }

        // -------------------------------------------------------------------------
        // 5) Send prompt with reuse of existing conversation thread (if any)
        //
        // We pass prompt + optional modes (`search`, `reason`) and the threadId.
        // ChatGPT will continue the conversation in the specified thread if provided.
        // -------------------------------------------------------------------------
        const prompt = "based on researching forbes data who are the top 10 richest person in australia as of may 2025";
        const options = {
            search: true,
            reason: false,
            threadId: '681a6cba-c0fc-8004-977c-f34adf806988'
        }
        const responseObject = await promptWithOptions(page, options, prompt);
        if (responseObject === null) {
            console.error('❌ No response or valid paragraph response received from ChatGPT.');
            // handle error: retry, exit, default value, etc.
        } else {
            const { threadId: returnedThreadId, response } = responseObject;
            console.log('📬 ChatGPT replied:', response);
            console.log('📌 Conversation ID:', returnedThreadId);
            // proceed with valid response and potentially save threadId for next run
        }


        console.log('✅ Automation flow complete.');

    } catch (error) {
        // -------------------------------------------------------------------------
        // Error handling: log the error and the last known page URL for debugging
        // -------------------------------------------------------------------------
        console.error('❌ An error occurred in the main process:', error);
        if (page) {
            console.error('Last page URL at error time:', page.url());
        }
    } finally {
        // -------------------------------------------------------------------------
        // Finalization: we leave the browser open so you can inspect the session.
        // To close it programmatically, uncomment the line below.
        // -------------------------------------------------------------------------
        console.log('🏁 Script finished.');
        await browser?.close();
    }
}

// Kick off the automation
openGPT();
