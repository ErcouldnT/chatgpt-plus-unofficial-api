const express = require('express');
const {performLoginWithBasicAuth} = require('../flows/basic-login');
const { getPage } = require('../services/puppeteer-services');
const { promptWithOptions } = require('../flows/prompt-flow');
const { isChatGPTLoggedIn } = require('../utils/helpers');

//handle login Routes
const promptRouter = express.Router();

//handle POST request for login
promptRouter.post('/',async (req,res,next)=> {
    console.log("In prompt post request...");
    //retrieve input passed from client
    const {prompt,options} = req.body;

    //get puppeteer page instance
    const page = getPage();

    if (await isChatGPTLoggedIn(page)) {
        console.log('✅ Already signed in — skipping login flow.');
    } else {
        console.log('🔐 Not signed in — running login flow…');
        await performLoginWithBasicAuth(page);
    }

    const response = await promptWithOptions(page,options,prompt);

    res.status(200).json(response);

});

module.exports = promptRouter;
