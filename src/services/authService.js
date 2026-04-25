import { apiLogin } from './apiService';

/**
 * Authenticate a user against the backend API.
 * Returns user object on success, null on failure.
 */
export async function authenticateUser(email, password) {
  try {
    const result = await apiLogin(email, password);
    if (result.success) return result.user;
    return null;
  } catch {
    return null;
  }
}
