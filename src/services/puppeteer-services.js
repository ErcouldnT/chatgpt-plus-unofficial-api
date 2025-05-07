// puppeteer-service.js
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

let pageInstance = null;
let browserInstance = null;

async function initializePage() {
    if (!browserInstance) {
        console.log('▶️ Launching browser with persistent profile…');

        const userDataDir = path.join(__dirname, '..', '..', 'chrome-user-data');

        browserInstance = await puppeteer.launch({
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
        pageInstance = await browserInstance.newPage();

        console.log('Puppeteer initialized, new page created.');
        // You might want to set a default viewport or other page settings here
        // await pageInstance.setViewport({ width: 1280, height: 800 });
    }
    return pageInstance;
}

function getPage() {
    if (!pageInstance) {
        throw new Error('Page has not been initialized. Call initializePage() first, typically at server startup.');
    }
    return pageInstance;
}

async function closeBrowser() {
    if (browserInstance) {
        console.log('Closing browser...');
        await browserInstance.close();
        browserInstance = null;
        pageInstance = null;
    }
}

module.exports = {
    initializePage,
    getPage,
    closeBrowser,
};