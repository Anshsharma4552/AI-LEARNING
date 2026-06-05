const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "CastError") {
        statusCode = 404;
        message = "Resource not found";
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        statusCode = 400;
        message = `${field} already exists`;
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map(val => val.message)
            .join(", ");
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 400;
        message = "File size exceeds the maximum limit of 10MB";
    }

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

export default errorHandler;