import { Issuer, generators } from "openid-client";

let clientPromise;

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const getOidcProviderName = () => process.env.OIDC_PROVIDER_NAME || "oidc";

export const getOidcClient = async () => {
  if (!clientPromise) {
    clientPromise = (async () => {
      const issuerUrl = getRequiredEnv("OIDC_ISSUER_URL");
      const clientId = getRequiredEnv("OIDC_CLIENT_ID");
      const redirectUri = getRequiredEnv("OIDC_REDIRECT_URI");
      const clientSecret = process.env.OIDC_CLIENT_SECRET;

      const issuer = await Issuer.discover(issuerUrl);

      const client = new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [redirectUri],
        response_types: ["code"],
      });

      return client;
    })();
  }

  return await clientPromise;
};

export const buildAuthorization = async ({ state }) => {
  const client = await getOidcClient();

  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  const scope = process.env.OIDC_SCOPE || "openid profile email";

  const authorizationUrl = client.authorizationUrl({
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return { authorizationUrl, codeVerifier };
};

export const handleCallback = async ({ params, state, codeVerifier }) => {
  const client = await getOidcClient();

  const tokenSet = await client.callback(process.env.OIDC_REDIRECT_URI, params, {
    state,
    code_verifier: codeVerifier,
  });

  const claims = tokenSet.claims();

  let userInfo;
  if (client.issuer.userinfo_endpoint && tokenSet.access_token) {
    userInfo = await client.userinfo(tokenSet.access_token);
  }

  return { tokenSet, claims, userInfo };
};
