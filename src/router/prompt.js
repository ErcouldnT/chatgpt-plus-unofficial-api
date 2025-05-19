const express = require('express');
const {performLoginWithBasicAuth} = require('../flows/basic-login');
const { getPage } = require('../services/puppeteer-services');
const { promptWithOptions } = require('../flows/prompt-flow');
const { isChatGPTLoggedIn } = require('../utils/helpers');

//import logger
const {getLogger} = require('../utils/logger');
const logger = getLogger("prompt.js");

//handle login Routes
const promptRouter = express.Router();

//handle POST request for login
promptRouter.post('/',async (req,res,next)=> {
    logger.debug("POST:/api/prompt","In prompt post request...");

    //retrieve input passed from client
    const {prompt,options} = req.body;

    //get puppeteer page instance
    const page = getPage();

    if (await isChatGPTLoggedIn(page)) {
        logger.debug("POST:/api/prompt",'✅ Already signed in — skipping login flow.');
    } else {
        logger.debug("POST:/api/prompt",'🔐 Not signed in — running login flow…');
        await performLoginWithBasicAuth(page);
    }

    const response = await promptWithOptions(page,options,prompt);

    res.status(200).json(response);

});

module.exports = promptRouter;
