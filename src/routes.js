import cors from "cors";
import express from "express";

import { verifyApiKey } from "./middlewares/auth.js";
import openaiRouter from "./router/openai.js";
import promptRouter from "./router/prompt.js";

const app = express();

// set up middleware
app.use(cors(
  { origin: true, credentials: true },
));
app.use(express.urlencoded({ extended: true })); // to read the post request from html form
app.use(express.json()); // to interpret json

// routes
app.use("/api/prompt", verifyApiKey, promptRouter);
app.use("/v1", verifyApiKey, openaiRouter);

app.get("/", (req, res) => {
  res.send("<html><body><h1>Server is up and running...</h1></body></html>");
});

export default app;
