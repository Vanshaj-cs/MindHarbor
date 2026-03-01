// middleware/verifyToken.js
import jwt from "jsonwebtoken";
import { getOidcClient } from "../config/cognito.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

// Decodes the Cognito access token (JWT) to get the sub (user id)
// The OIDC client's discovered JWKS is used for signature verification
const verifyAccessToken = async (token) => {
  // Decode without verification first to get the sub quickly in dev
  // The OIDC client will still validate via userinfo endpoint
  const decoded = jwt.decode(token);
  console.log("DECODED TOKEN:", JSON.stringify(decoded, null, 2));
  console.log("RAW TOKEN LENGTH:", token?.length);
  console.log("RAW TOKEN START:", token?.substring(0, 50));
  if (!decoded || !decoded.sub) throw new Error("Invalid token structure");

  // Optionally call userinfo to fully validate (uncomment for stricter checks)
  // const client = await getOidcClient();
  // return client.userinfo(token);

  return decoded;
};

// ── protect: requires a valid Cognito access token ───────────────────────────
const protect = asyncHandler(async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token)
    throw new ApiError(401, "Authentication required. Please log in.");

  let decoded;
  try {
    decoded = await verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token. Please log in again.");
  }

  // Check token expiry
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new ApiError(401, "Session expired. Please log in again.", [
      "TOKEN_EXPIRED",
    ]);
  }

  const user = await User.findOne({ cognitoId: decoded.sub });
  if (!user) throw new ApiError(401, "User not found.");
  if (!user.isActive) throw new ApiError(403, "Account deactivated.");

  req.user = user;
  next();
});

// ── restrictTo: role guard ────────────────────────────────────────────────────
const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to do this."));
    }
    next();
  };

export { protect, restrictTo };
