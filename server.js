require('dotenv').config();
const express = require('express');

//const variables
const PORT = process.env.PORT || 3001;

const server = express();

//we require app.js as it handles all the routes
const routesHandler = require('./routes');
const { initializePage } = require('./src/services/puppeteer-services');

//app is a middleware fn which is included here i.e. it is used in server but the code is defined else where but we use it here
server.use(routesHandler);

// Create an async function to start the server
async function startServer() {
    try {
        // Initialize Puppeteer and the shared page before the server starts listening
        await initializePage();
        console.log('Shared Puppeteer page initialized successfully.');

        server.listen(PORT, () => {
            console.log(`📺 Server is running on http://localhost:${PORT}`);
            console.log('🌐 Puppeteer service is active and page is ready for use by API routes.\n');
        });
    } catch (error) {
        console.error('Failed to initialize Puppeteer or start server:', error);
        process.exit(1); // Exit if critical initialization fails
    }
}

startServer();