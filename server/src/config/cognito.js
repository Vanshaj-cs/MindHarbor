import pkg from "amazon-cognito-identity-js";
import { Issuer, generators } from "openid-client";

const {
  CognitoUserPool,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
} = pkg;

// ── User Pool (no client secret needed) ──────────────────────────────────────
export const userPool = new CognitoUserPool({
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
  // No client secret here — App Client must be created WITHOUT a secret
});

// ── OIDC Client (Google OAuth – lazy initialized) ─────────────────────────────
let oidcClient = null;

export const getOidcClient = async () => {
  if (oidcClient) return oidcClient;

  try {
    const issuer = await Issuer.discover(
      `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    );
    oidcClient = new issuer.Client({
      client_id: process.env.COGNITO_CLIENT_ID,
      // No client_secret since we removed it from the App Client
      redirect_uris: [process.env.COGNITO_REDIRECT_URI],
      response_types: ["code"],
    });
    console.log("✅ OIDC client initialized (Google login ready)");
    return oidcClient;
  } catch (err) {
    console.warn("⚠️  OIDC init failed:", err.message);
    throw new Error("Google login unavailable. Check your Cognito config.");
  }
};

export const buildGoogleAuthUrl = async (nonce, state) => {
  const client = await getOidcClient();
  return client.authorizationUrl({
    scope: "openid email profile",
    identity_provider: "Google",
    state,
    nonce,
  });
};

export { CognitoUserAttribute, AuthenticationDetails, CognitoUser, generators };
