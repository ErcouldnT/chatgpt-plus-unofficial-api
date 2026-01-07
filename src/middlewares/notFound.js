import { AppError } from "../utils/errors.js";

/**
 * Middleware to handle 404 Not Found
 */
export const notFound = (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, "not_found_error"));
};
