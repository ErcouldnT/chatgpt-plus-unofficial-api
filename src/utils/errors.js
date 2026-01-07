/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, type = "server_error", param = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.type = type;
    this.param = param;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
