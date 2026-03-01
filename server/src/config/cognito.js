// config/cognito.js
import { Issuer, generators } from "openid-client";
import pkg from "amazon-cognito-identity-js";

const {
  CognitoUserPool,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
} = pkg;

// ── Cognito User Pool (for email/password auth) ───────────────────────────────
const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

// ── OIDC Client (for Google OAuth via Cognito Hosted UI) ──────────────────────
let oidcClient = null;

export const initOidcClient = async () => {
  try {
    // Auto-discovers Cognito's OIDC endpoints (jwks_uri, token_endpoint, etc.)
    const issuer = await Issuer.discover(
      `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    );

    oidcClient = new issuer.Client({
      client_id: process.env.COGNITO_CLIENT_ID,
      client_secret: process.env.COGNITO_CLIENT_SECRET,
      redirect_uris: [process.env.COGNITO_REDIRECT_URI],
      response_types: ["code"],
    });

    console.log("✅ OIDC client initialized");
    return oidcClient;
  } catch (err) {
    console.error("❌ OIDC client init failed:", err.message);
    throw err;
  }
};

// Returns the initialized OIDC client (call after initOidcClient)
export const getOidcClient = () => {
  if (!oidcClient)
    throw new Error(
      "OIDC client not initialized. Call initOidcClient() first.",
    );
  return oidcClient;
};

// Generates a Google login URL with nonce + state baked in
export const buildGoogleAuthUrl = (nonce, state) => {
  const client = getOidcClient();
  return client.authorizationUrl({
    scope: "openid email profile",
    identity_provider: "Google",
    state,
    nonce,
  });
};

export {
  userPool,
  poolData,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
  generators, // re-export so controllers can use generators.nonce() / generators.state()
};
