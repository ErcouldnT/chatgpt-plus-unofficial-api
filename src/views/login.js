const express = require('express');
const {performLoginWithBasicAuth} = require('../flows/basic-login');
const { getPage } = require('../services/puppeteer-services');

//handle login Routes
const loginRouter = express.Router();

//handle POST request for login
loginRouter.post('/',(req,res,next)=> {
    //retrieve input passed from client
    const {email,password} = req.body;

    //get puppeteer page instance
    const page = getPage();

    // performLoginWithBasicAuth(page)

});

module.exports = loginRouter;