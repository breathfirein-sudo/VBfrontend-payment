/**
 * Retrieves the authorization bearer token from localStorage.
 */
export const getAuthToken = async () => {
  const token = localStorage.getItem('vb_jwt_token');
  return token || 'dummy-token-for-dev';
};
