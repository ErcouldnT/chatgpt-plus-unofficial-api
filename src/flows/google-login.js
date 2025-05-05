// Contains the logic specific to the login process
const { waitForTimeout } = require('../utils/helpers'); // Import helper

async function performLoginWithGoogle(page) {

  console.log('Waiting for page load and potential redirects...');
  // Wait a bit longer after network idle, as redirects might occur
  await waitForTimeout(3000);

  //using aria selector as it helps to find element using computed accessible names
  console.log('Locating the Log in button...');
  const loginButtonSelector = '::-p-aria(Log in)';

  //wait for the login button aria helps as don't need to wait for any particular DOM structure or DOM attribute to load
  console.log('Waiting for Log in button to be visible...');
  const loginButtonLocator = await page.locator(loginButtonSelector);

  console.log('Clicking the Log in button...');
  await loginButtonLocator.click();

  // Wait a bit longer after network idle, as redirects might occur
  await waitForTimeout(3000);

  //wait for Continue with Google button on the openai auth page
  const googleAuthSelector = 'div ::-p-text(Continue with Google)';

  //wait for google auth button to be visible
  console.log('Waiting for Log in button to be visible...');
  const googleAuthLocator = await page.locator(googleAuthSelector);

  console.log("clicking the google login button...");
  await googleAuthLocator.click();



  console.log('Log in button clicked. Enter the signup page.');



}

module.exports = {
  performLoginWithGoogle,
};
