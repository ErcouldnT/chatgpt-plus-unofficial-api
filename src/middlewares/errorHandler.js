/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
    console.error("EXPRESS ERROR:", err);

    // Show detailed message only in development
    const isDev = process.env.NODE_ENV === "development";
    const message = isDev ? (err.message || "Internal Server Error") : "Internal Server Error";

    // Standard error response format
    res.status(err.status || 500).json({
        error: {
            message,
            type: err.type || "server_error",
            param: err.param || null,
            code: err.code || null
        }
    });
};
