// middleware/verifyToken.js
import { getOidcClient } from "../config/cognito.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

// ── Verify access token via OIDC client (uses discovered JWKS automatically) ──
const verifyAccessToken = async (token) => {
  const client = getOidcClient();
  // openid-client fetches + caches JWKS from the discovered jwks_uri
  return client.introspect
    ? client.introspect(token) // if introspection endpoint available
    : client.userinfo(token); // fallback: validate by fetching userinfo
};

// ── Protect: requires a valid Cognito access token ───────────────────────────
const protect = asyncHandler(async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token)
    throw new ApiError(401, "Authentication required. Please log in.");

  let userInfo;
  try {
    userInfo = await verifyAccessToken(token);
  } catch (err) {
    if (err.message?.includes("expired")) {
      throw new ApiError(401, "Session expired. Please log in again.", [
        "TOKEN_EXPIRED",
      ]);
    }
    throw new ApiError(401, "Invalid token.");
  }

  // sub is the Cognito user ID
  const user = await User.findOne({ cognitoId: userInfo.sub });
  if (!user) throw new ApiError(401, "User not found.");
  if (!user.isActive) throw new ApiError(403, "Account deactivated.");

  req.user = user;
  next();
});

// ── RestrictTo: role-based guard ──────────────────────────────────────────────
const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to do this."));
    }
    next();
  };

export { protect, restrictTo };
