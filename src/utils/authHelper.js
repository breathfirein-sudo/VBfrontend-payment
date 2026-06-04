import { auth } from '../firebase';

/**
 * Generates a mock signed JWT token containing email & name in the payload.
 * The backend'srequireAuth middleware will be able to decode this token
 * using jwt.decode(token) to identify standard users.
 */
export const makeMockToken = (email) => {
  if (!email) return 'dummy-token-for-dev';
  try {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ email: email.toLowerCase(), name: email.split('@')[0] }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    return `${header}.${payload}.mocksignature`;
  } catch (err) {
    console.error("Error creating mock token:", err);
    return 'dummy-token-for-dev';
  }
};

/**
 * Retrieves the authorization bearer token. If logged into Firebase,
 * retrieves the Firebase ID token. Otherwise, falls back to generating
 * a mock JWT token using the local user session.
 */
export const getAuthToken = async (localUser) => {
  try {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (e) {
    console.error("Error getting Firebase ID token:", e);
  }
  
  if (localUser && localUser.email) {
    return makeMockToken(localUser.email);
  }
  return 'dummy-token-for-dev';
};
