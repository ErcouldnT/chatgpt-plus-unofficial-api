const cors = require("cors");
const express = require("express");

const verifyApiKey = require("./src/middlewares/auth");
// express routers to handle route
const promptRouter = require("./src/router/prompt");

const app = express();

// set up middleware
app.use(cors(
  { origin: true, credentials: true },
));
app.use(express.urlencoded({ extended: true })); // to read the post request from html form
app.use(express.json()); // to interpret json

// routes
app.use("/api/prompt", verifyApiKey, promptRouter);

app.get("/", (req, res) => {
  res.send("<html><body><h1>Server is up and running...</h1></body></html>");
});

module.exports = app;
