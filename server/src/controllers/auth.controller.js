import crypto from "crypto";
import pkg from "amazon-cognito-identity-js";

const { CognitoRefreshToken } = pkg;

import {
  userPool,
  getOidcClient,
  buildGoogleAuthUrl,
  generators,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
} from "../config/cognito.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Wraps Cognito's callback style into a Promise
const cognitoPromise = (fn) =>
  new Promise((resolve, reject) =>
    fn((err, result) => (err ? reject(err) : resolve(result))),
  );

const setTokenCookies = (res, { accessToken, refreshToken, idToken }) => {
  const opts = { httpOnly: true, sameSite: "lax" };
  res.cookie("accessToken", accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, {
    ...opts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  if (idToken)
    res.cookie("idToken", idToken, { ...opts, maxAge: 15 * 60 * 1000 });
};

const clearTokenCookies = (res) =>
  ["accessToken", "refreshToken", "idToken"].forEach((name) =>
    res.clearCookie(name),
  );

const createSession = async (userId, rawRefreshToken, req) => {
  await Session.create({
    userId,
    tokenHash: Session.hashToken(rawRefreshToken),
    deviceInfo: { userAgent: req.headers["user-agent"], ip: req.ip },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  1. REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, username, institution } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new ApiError(
      409,
      existing.email === email
        ? "Email already in use."
        : "Username already taken.",
    );
  }

  const attributeList = [
    new CognitoUserAttribute({ Name: "email", Value: email }),
    new CognitoUserAttribute({ Name: "name", Value: fullName || "" }),
  ];

  const cognitoResult = await cognitoPromise((cb) =>
    userPool.signUp(email, password, attributeList, null, cb),
  );

  const user = await User.create({
    cognitoId: cognitoResult.userSub,
    email,
    username,
    fullName,
    institution,
    authProvider: "cognito",
    isEmailVerified: false,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { userId: user._id, email: user.email },
        "Registered! Check your email for a verification code.",
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const code = String(req.body.code); // 🔥 ensure it's always a string

  if (!email || !code) {
    throw new ApiError(400, "Email and verification code are required.");
  }

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  await cognitoPromise((cb) => cognitoUser.confirmRegistration(code, true, cb));

  const user = await User.findOneAndUpdate(
    { email },
    { isEmailVerified: true },
    { returnDocument: "after" }, // ✅ fixes mongoose warning
  );

  if (!user) throw new ApiError(404, "User not found.");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        email: user.email,
        verified: true,
      },
      "Email verified successfully. You can now log in.",
    ),
  );
});
// ─────────────────────────────────────────────────────────────────────────────
//  3. RESEND VERIFICATION CODE
// ─────────────────────────────────────────────────────────────────────────────
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
  await cognitoPromise((cb) => cognitoUser.resendConfirmationCode(cb));

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Verification code resent."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const dbUser = await User.findOne({ email });
  if (!dbUser) throw new ApiError(401, "Invalid email or password.");

  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });
  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

  let result;
  try {
    result = await cognitoPromise((cb) =>
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (r) => cb(null, r),
        onFailure: (err) => cb(err),
      }),
    );
  } catch (err) {
    if (err.code === "UserNotConfirmedException") {
      throw new ApiError(403, "Please verify your email before logging in.", [
        "EMAIL_NOT_VERIFIED",
      ]);
    }
    if (err.code === "NotAuthorizedException") {
      throw new ApiError(401, "Invalid email or password.");
    }
    throw err;
  }

  const tokens = {
    accessToken: result.getAccessToken().getJwtToken(),
    idToken: result.getIdToken().getJwtToken(),
    refreshToken: result.getRefreshToken().getToken(),
  };

  await Promise.all([
    dbUser.updateOne({ lastLogin: new Date(), $inc: { loginCount: 1 } }),
    createSession(dbUser._id, tokens.refreshToken, req),
  ]);

  setTokenCookies(res, tokens);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: dbUser.toSafeObject(),
        tokens: { accessToken: tokens.accessToken, idToken: tokens.idToken },
      },
      "Login successful.",
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!rawRefreshToken) throw new ApiError(401, "Refresh token missing.");

  const session = await Session.findByToken(rawRefreshToken);
  if (!session)
    throw new ApiError(401, "Session expired. Please log in again.");

  const user = await User.findById(session.userId);
  if (!user) throw new ApiError(401, "User not found.");

  const cognitoUser = new CognitoUser({ Username: user.email, Pool: userPool });
  const refreshTokenObj = new CognitoRefreshToken({
    RefreshToken: rawRefreshToken,
  });

  const result = await cognitoPromise((cb) =>
    cognitoUser.refreshSession(refreshTokenObj, cb),
  );

  const tokens = {
    accessToken: result.getAccessToken().getJwtToken(),
    idToken: result.getIdToken().getJwtToken(),
    refreshToken: rawRefreshToken,
  };

  setTokenCookies(res, tokens);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken: tokens.accessToken, idToken: tokens.idToken },
        "Token refreshed.",
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (rawRefreshToken) {
    await Session.findOneAndUpdate(
      { tokenHash: Session.hashToken(rawRefreshToken) },
      { isRevoked: true },
    );
  }

  if (req.session) req.session.destroy(() => {});
  clearTokenCookies(res);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
  await cognitoPromise((cb) =>
    cognitoUser.forgotPassword({
      onSuccess: (d) => cb(null, d),
      onFailure: cb,
    }),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "If that email exists, a reset code has been sent.",
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  8. RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
  await cognitoPromise((cb) =>
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => cb(null, true),
      onFailure: cb,
    }),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Password reset successful. Please log in."),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  9. GOOGLE AUTH – Redirect
// ─────────────────────────────────────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req, res) => {
  const nonce = generators.nonce();
  const state = generators.state();

  req.session.nonce = nonce;
  req.session.state = state;

  const authUrl = await buildGoogleAuthUrl(nonce, state);
  res.redirect(authUrl);
});

// ─────────────────────────────────────────────────────────────────────────────
//  10. GOOGLE AUTH – Callback
// ─────────────────────────────────────────────────────────────────────────────
export const googleCallback = asyncHandler(async (req, res) => {
  const client = await getOidcClient();
  const params = client.callbackParams(req);

  let tokenSet;
  try {
    tokenSet = await client.callback(process.env.COGNITO_REDIRECT_URI, params, {
      nonce: req.session.nonce,
      state: req.session.state,
    });
  } catch (err) {
    console.error("OIDC callback error:", err.message);
    throw new ApiError(401, `Google login failed: ${err.message}`);
  }

  req.session.nonce = null;
  req.session.state = null;

  const userInfo = await client.userinfo(tokenSet.access_token);
  const { sub: cognitoId, email, name, picture } = userInfo;

  let user = await User.findOne({ cognitoId });

  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      await user.updateOne({
        cognitoId,
        googleId: cognitoId,
        authProvider: "both",
        isEmailVerified: true,
        profilePicture: user.profilePicture || picture,
      });
      user = await User.findById(user._id);
    } else {
      const username = `${email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")}_${crypto.randomBytes(3).toString("hex")}`;
      user = await User.create({
        cognitoId,
        googleId: cognitoId,
        email,
        fullName: name,
        username,
        profilePicture: picture,
        authProvider: "google",
        isEmailVerified: true,
      });
    }
  }

  const tokens = {
    accessToken: tokenSet.access_token,
    idToken: tokenSet.id_token,
    refreshToken: tokenSet.refresh_token,
  };

  await Promise.all([
    user.updateOne({ lastLogin: new Date(), $inc: { loginCount: 1 } }),
    createSession(user._id, tokenSet.refresh_token, req),
  ]);

  setTokenCookies(res, tokens);
  return res.redirect(`${process.env.CLIENT_URL}/auth/callback?success=true`);
});

// ─────────────────────────────────────────────────────────────────────────────
//  11. GET CURRENT USER
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found.");
  return res.status(200).json(new ApiResponse(200, user.toSafeObject()));
});

// ─────────────────────────────────────────────────────────────────────────────
//  12. UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const ALLOWED = [
    "fullName",
    "username",
    "institution",
    "preferences",
    "profilePicture",
  ];
  const updates = {};
  ALLOWED.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (updates.username) {
    const taken = await User.findOne({
      username: updates.username,
      _id: { $ne: req.user._id },
    });
    if (taken) throw new ApiError(409, "Username already taken.");
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, user.toSafeObject(), "Profile updated."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  13. DELETE ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAccount = asyncHandler(async (req, res) => {
  await Promise.all([
    Session.deleteMany({ userId: req.user._id }),
    User.findByIdAndDelete(req.user._id),
  ]);

  if (req.session) req.session.destroy(() => {});
  clearTokenCookies(res);
  return res.status(200).json(new ApiResponse(200, null, "Account deleted."));
});
