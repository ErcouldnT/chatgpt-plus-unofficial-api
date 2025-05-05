require('dotenv').config()
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {performLoginWithGoogle} = require("./src/flows/google-login.js")

puppeteer.use(StealthPlugin());

const waitForTimeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function openGPT() {
  let browser = null; // Define browser outside try block for potential cleanup
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({ headless: false });

    console.log('Opening new page...');
    const page = await browser.newPage();

    console.log('Navigating to OpenAI login...');
    await page.goto('https://chatgpt.com');

    performLoginWithGoogle(page);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    if (browser) {
        // Attempt to close the browser even if an error occurred
        // await browser.close();
      }
  }
}

// Call the function to execute the script
openGPT();

