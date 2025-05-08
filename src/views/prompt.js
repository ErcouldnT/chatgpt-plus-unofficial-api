const express = require('express');
const {performLoginWithBasicAuth} = require('../flows/basic-login');
const { getPage } = require('../services/puppeteer-services');
const { promptWithOptions } = require('../flows/prompt-flow');

//handle login Routes
const promptRouter = express.Router();

//handle POST request for login
promptRouter.post('/',async (req,res,next)=> {
    console.log("In prompt post request...");
    //retrieve input passed from client
    const {prompt,options} = req.body;

    //get puppeteer page instance
    const page = getPage();

    const response = await promptWithOptions(page,options,prompt);

    res.status(200).json(response);

});

module.exports = promptRouter;
