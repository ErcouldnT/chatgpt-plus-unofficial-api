// src/utils/helpers.js
// Contains reusable utility functions for ChatGPT automation flows

/**
 * Returns a Promise that resolves after a specified timeout.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} Resolves after the timeout completes.
 */
const waitForTimeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  
  /**
   * Checks whether the ChatGPT web session is already authenticated.
   *
   * This helper performs two checks:
   *  1. Verifies if `localStorage.oai-did` exists, indicating a client-side
   *     authenticated user ID post-login.
   *  2. Inspects cookies for the presence of the `__Secure-next-auth.session-token`
   *     cookie, which NextAuth.js sets upon successful server-side authentication.
   *
   * @param {import('puppeteer').Page} page - The Puppeteer Page instance.
   * @returns {Promise<boolean>} `true` if an authenticated session is detected; otherwise `false`.
   */
  async function isChatGPTLoggedIn(page) {
    // 1) Check for client-side user ID in localStorage
    const hasDid = await page.evaluate(() => {
      return !!window.localStorage.getItem('oai-did');
    });
    if (hasDid) return true;
  
    // 2) Check for NextAuth session cookie
    const cookies = await page.cookies();
    return cookies.some(c => c.name === '__Secure-next-auth.session-token');
  }


  /**
 * Given a raw response string that contains a literal <p>…</p>,
 * extract the inner content and trim off one pair of matching quotes.
 *
 * @param {string} raw
 * @returns {string|null}  cleaned text or null if nothing extracted
 */
function extractParagraphContent(raw) {
    // 1) Find the first <p>…</p> block
    const match = raw.match(/<p>([\s\S]*?)<\/p>/i);
    if (!match) return null;           // no <p>…</p> found
  
    let inner = match[1].trim();       // what's between the tags
  
    // 2) Remove exactly one matching pair of quotes around it
    inner = inner.replace(/^(['"])([\s\S]*)\1$/, '$2');
  
    return inner;
  }
  
  
  module.exports = {
    waitForTimeout,
    isChatGPTLoggedIn,
    extractParagraphContent
  };
  