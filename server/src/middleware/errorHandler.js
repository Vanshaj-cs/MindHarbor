import { ApiError } from "../utils/apiError.js";

// Map Cognito error codes → readable messages
const COGNITO_ERRORS = {
  NotAuthorizedException: {
    message: "Invalid email or password.",
    status: 401,
  },
  UserNotFoundException: { message: "Invalid email or password.", status: 401 },
  UsernameExistsException: {
    message: "An account with this email already exists.",
    status: 409,
  },
  CodeMismatchException: {
    message: "Invalid or expired verification code.",
    status: 400,
  },
  ExpiredCodeException: {
    message: "Verification code expired. Request a new one.",
    status: 400,
  },
  LimitExceededException: {
    message: "Too many attempts. Try again later.",
    status: 429,
  },
  InvalidPasswordException: {
    message: "Password does not meet requirements.",
    status: 400,
  },
  UserNotConfirmedException: {
    message: "Please verify your email before logging in.",
    status: 403,
  },
  InvalidParameterException: {
    message: "Invalid input. Please check your details.",
    status: 400,
  },
};

const errorHandler = (err, req, res, _next) => {
  console.error(`[${req.method}] ${req.path} →`, err.message);

  // ApiError (thrown manually in controllers/middleware)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Cognito errors
  if (COGNITO_ERRORS[err.code]) {
    const { message, status } = COGNITO_ERRORS[err.code];
    return res
      .status(status)
      .json({ success: false, message, errors: [err.code] });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already in use.`,
      errors: ["DUPLICATE_KEY"],
    });
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: messages,
    });
  }

  // Fallback
  return res.status(500).json({
    success: false,
    message: err.message || "Something went wrong.",
    errors: [],
    stack: err.stack, // show stack in dev
  });
};

export default errorHandler;
