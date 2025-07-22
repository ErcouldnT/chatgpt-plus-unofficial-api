import * as cheerio from "cheerio";

/**
 * Returns a Promise that resolves after a specified timeout.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} Resolves after the timeout completes.
 */
export function waitForTimeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
export async function isChatGPTLoggedIn(page) {
  // Ensure we're on the correct ChatGPT host
  if (!page.url().startsWith("https://chatgpt.com")) {
    await page.goto("https://chatgpt.com");
  }

  // Perform fetch inside browser context since `page.request` is not available in Puppeteer
  const session = await page.evaluate(async () => {
    try {
      // Request current auth session; includes cookies for proper context
      const res = await fetch("https://chatgpt.com/api/auth/session", { credentials: "include" });
      if (!res.ok)
        return {}; // Non-200 → no session
      return await res.json(); // Parsed session object
    }
    catch {
      return {}; // Network/error → treat as not logged in
    }
  });
  // Non-empty object indicates authenticated session
  return session && Object.keys(session).length > 0;
}

/**
 * Convert HTML (including tables, headings, links) to plain text.
 * - Skips <button> elements entirely
 * - Renders headings on their own lines
 * - Preserves paragraphs with blank lines
 * - Inlines links as "text (url)"
 * - Formats tables with tabs between cells and newlines between rows
 *
 * @param {string} html - Raw HTML string to convert
 * @returns {string}    - Plain-text representation
 */
export function htmlResponseToText(html) {
  if (!html)
    return "";
  const $ = cheerio.load(html);

  // Remove all <button> elements
  $("button").remove();

  // Convert bold/italic tags before other transformations
  // Bold → **text**, Italic → __text__
  // Use .toArray() to avoid Cheerio's node-removal skipping bug
  // $("b,strong")
  //   .toArray()
  //   .forEach((el) => {
  //     const txt = $(el).text().trim();
  //     $(el).replaceWith(`**${txt}**`);
  //   });

  // $("i,em")
  //   .toArray()
  //   .forEach((el) => {
  //     const txt = $(el).text().trim();
  //     $(el).replaceWith(`__${txt}__`);
  //   });

  // Convert tables to text
  $("table").each((_, table) => {
    const rows = [];
    $(table)
      .find("tr")
      .each((_, tr) => {
        const cells = [];
        $(tr)
          .find("th,td")
          .each((_, cell) => {
            cells.push($(cell).text().trim());
          });
        rows.push(cells.join("\t"));
      });
    $(table).replaceWith(rows.join("\n"));
  });

  // Headings on their own lines
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    const text = $(el).text().trim();
    $(el).replaceWith(`\n${text}\n`);
  });

  // Links as "text (url)"
  $("a").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href");
    $(el).replaceWith(href ? `${text} (${href})` : text);
  });

  // Paragraphs with blank lines
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    $(el).replaceWith(`\n${text}\n`);
  });

  // Get plain text
  let text = $.root().text();
  // Remove extra blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
