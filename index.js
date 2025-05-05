// index.js
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { performLoginWithGoogle } = require('./src/flows/google-login');

// puppeteer.use(StealthPlugin());

async function main() {
  let browser = null;
  let page = null;

  try {
    console.log('Launching browser with your Chrome Profile 1…');

    // Build the absolute path to your Profile 1 folder
    const userDataDir = path.join(
      process.env.USERPROFILE,
      'AppData',
      'Local',
      'Google',
      'Chrome',
      'User Data',
      'Profile 1'
    );

    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--user-data-dir=${userDataDir}`,      // Use your existing profile
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ]
      // NOTE: removed extension flags; no extensions will be loaded
    });

    console.log('Opening a fresh page…');
    page = await browser.newPage();

    // Use chatgpt.com as the entry point
    console.log('Navigating to OpenAI login...');
    await page.goto('https://chatgpt.com', { waitUntil: 'networkidle0' });  

    // Now run your Google login flow
    await performLoginWithGoogle(page);

    console.log('All tasks done. ✨');

  } catch (error) {
    console.error('An error occurred in the main process:', error);
    if (page) {
      console.error('Page URL at error time:', page.url());
    }
  } finally {
    console.log('Script finished.');
    // optionally
    // if (browser) await browser.close();
  }
}

main();
