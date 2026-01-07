import process from "node:process";
import dotenv from "dotenv";
import { AppError } from "../utils/errors.js";

dotenv.config();

export function verifyApiKey(req, res, next) {
  // skip API key verification in development mode
  if (process.env.NODE_ENV === "development") {
    return next();
  }
  // Check for custom header or standard Authorization Bearer header
  const clientKey = req.header("ERKUT-API-KEY");
  const authHeader = req.header("Authorization");

  let token = clientKey;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token || token !== process.env.ERKUT_API_KEY) {
    return next(new AppError("Invalid API key", 401, "invalid_request_error"));
  }
  next();
}
