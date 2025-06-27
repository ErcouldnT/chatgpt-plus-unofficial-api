require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

//express routers to handle route
const promptRouter = require("./src/router/prompt");

const app = express();

//set up middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
); //to enable cross origin resource sharing ie make post,get,etc request form different url
app.use(bodyParser.urlencoded({ extended: true })); //to read the post request from html form
app.use(express.json()); //to interpret json

// auth middleware
function verifyApiKey(req, res, next) {
  const clientKey = req.header("ERKUT-API-KEY");
  if (!clientKey || clientKey !== process.env.ERKUT_API_KEY) {
    return res.status(401).json({ error: "invalid api key" });
  }
  next();
}

//Routes
app.use("/api/prompt", verifyApiKey, promptRouter);

app.get("/", (req, res) => {
  res.send("<html><body><h1>Server is up and Running......</h1></body></html>");
});

module.exports = app;
