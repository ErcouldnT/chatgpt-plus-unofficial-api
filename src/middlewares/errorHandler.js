import process from "node:process";
import dotenv from "dotenv";

dotenv.config();

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === "development") {
        console.error("DEBUG ERROR:", err);
        res.status(err.statusCode).json({
            error: {
                message: err.message,
                type: err.type || "server_error",
                param: err.param || null,
                code: err.code || null,
                stack: err.stack
            }
        });
    } else {
        // Production: Don't leak error details
        if (err.isOperational) {
            res.status(err.statusCode).json({
                error: {
                    message: err.message,
                    type: err.type,
                    param: err.param,
                    code: err.code
                }
            });
        } else {
            // Programming or other unknown error: don't leak error details
            console.error('ERROR 💥', err);
            res.status(500).json({
                error: {
                    message: 'Something went wrong!',
                    type: 'server_error'
                }
            });
        }
    }
};
