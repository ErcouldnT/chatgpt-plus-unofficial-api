import process from "node:process";
import { AppError } from "../utils/errors.js";


export function verifyApiKey(req, res, next) {
  // skip API key verification in development mode
  console.log(`[Auth] Checking NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV === "development") {
    console.log("🔓 [Auth] Development mode: Bypassing API key verification.");
    return next();
  }
  // Check for custom header or standard Authorization Bearer header
  const clientKey = req.header("ERKUT-API-KEY");
  const authHeader = req.header("Authorization");

  let token = clientKey;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // Normalize server key (remove quotes if present, common issue with Docker --env-file)
  const serverKey = process.env.ERKUT_API_KEY ? process.env.ERKUT_API_KEY.replace(/^"|"$/g, '') : null;

  if (!token || token !== serverKey) {
    return next(new AppError("Invalid API key", 401, "invalid_request_error"));
  }

  next();
}
