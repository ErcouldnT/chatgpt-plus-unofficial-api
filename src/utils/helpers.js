// src/utils/helpers.js
// Contains reusable utility functions for ChatGPT automation flows
// const {htmlToText} = require('html-to-text');

/**
 * Returns a Promise that resolves after a specified timeout.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} Resolves after the timeout completes.
 */
const waitForTimeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};


/**
 * Checks whether the ChatGPT web session is authenticated by querying
 * the official `/api/auth/session` endpoint.
 *
 * This method avoids relying on fragile client-side checks (like localStorage or cookies)
 * and instead performs a direct HTTP GET request using Puppeteer's built-in request API.
 *
 * OpenAI's `/api/auth/session` endpoint responds with:
 *  - A populated JSON object if the user is authenticated (contains `user`, `account`, etc.).
 *  - An empty object `{}` if the user is not logged in.
 *
 * @param {import('puppeteer').Page} page - The Puppeteer Page instance.
 * @returns {Promise<boolean>} `true` if the user is logged in; otherwise `false`.
 */
async function isChatGPTLoggedIn(page) {

  // Ensure we're on the correct ChatGPT host
  if (!page.url().startsWith('https://chatgpt.com')) {
    await page.goto('https://chatgpt.com');
  }

  // Perform fetch inside browser context since `page.request` is not available in Puppeteer
  const session = await page.evaluate(async () => {
    try {
      // Request current auth session; includes cookies for proper context
      const res = await fetch('https://chatgpt.com/api/auth/session', { credentials: 'include' });
      if (!res.ok) return {};          // Non-200 → no session
      return await res.json();         // Parsed session object
    } catch {
      return {};                       // Network/error → treat as not logged in
    }
  });
  // Non-empty object indicates authenticated session
  return session && Object.keys(session).length > 0;
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

/**
 * Converts any HTML string into well-formatted plain text.
 * - Ignores <button> elements.
 * - Renders tables with column separations and line breaks.
 * @param {string} html
 * @returns {string|null}  formatted text or null if none
 */
function htmlResponseToText(html) {
  // if (!html) return null;
  // const text = htmlToText(html, {
  //   wordwrap: false,
  //   selectors: [
  //     { selector: 'button', format: 'skip' }
  //   ],
  //   tables: [
  //     {            // render all tables
  //       options: { 
  //         rowDelimiter: '\n', 
  //         columnDelimiter: '\t' 
  //       }
  //     }
  //   ],
  //   // preserve headings and paragraphs
  //   formatters: {
  //     heading: (elem, walk, builder) => { builder.openBlock(); walk(elem.children, builder); builder.add('\n'); builder.closeBlock(); },
  //     // default for paragraphs
    // },
  // });
  // return text.trim() || null;
  return null;
}



module.exports = {
  waitForTimeout,
  isChatGPTLoggedIn,
  extractParagraphContent,
  htmlResponseToText
};
