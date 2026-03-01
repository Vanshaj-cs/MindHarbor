import { ApiError } from "../utils/apiError.js";

export const errorHandler = (err, _req, res, _next) => {
	console.error("GLOBAL ERROR:", err);

	if (err instanceof ApiError) {
		return res.status(err.statusCode).json(err);
	}

	return res.status(500).json(
		new ApiError(
			500,
			err.message || "Internal Server Error"
		)
	);
};