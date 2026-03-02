import { validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

/**
 * Runs after express-validator rules.
 * Collects all validation errors and throws a single ApiError with all messages.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg);
    // Pass messages array as both the main message and the errors[] field
    return next(new ApiError(400, errorMessages[0], errorMessages));
  }
  next();
};

export { validate };