import process from "node:process";
import dotenv from "dotenv";

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
    return res.status(401).json({ error: "invalid api key" });
  }
  next();
}
