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

// Builds a Cognito Hosted UI URL for Google sign-in.
// Uses the /oauth2/authorize endpoint (NOT the OIDC endpoint) because
// identity_provider=Google is a Cognito-specific Hosted UI parameter.
// Requires COGNITO_DOMAIN in .env  e.g: https://mindspace.auth.ap-south-1.amazoncognito.com
export const buildGoogleAuthUrl = (state) => {
  const domain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const redirectUri = process.env.COGNITO_REDIRECT_URI;

  if (!domain)
    throw new Error("COGNITO_DOMAIN is not set in environment variables.");

  const params = new URLSearchParams({
    identity_provider: "Google",
    redirect_uri: redirectUri,
    response_type: "code",
    client_id: clientId,
    scope: "openid email profile",
    state,
  });

  return `${domain}/oauth2/authorize?${params.toString()}`;
};

export { CognitoUserAttribute, AuthenticationDetails, CognitoUser, generators };
