
import { fetchData } from './fetchData.js';

export const api = {
  login: (credential, password) => fetchData('/auth/login', 'POST', { [credential.includes('@') ? 'email' : 'username']: credential, password }),
  register: (username, password, email) => fetchData('/auth/register', 'POST', { username, password, ...(email ? { email } : {}) }),
  logout: () => fetchData('/auth/logout', 'DELETE'),
  getLeaderboard: () => fetchData('/users/', 'GET'),
  getMe: () => fetchData('/users/me', 'GET'),
  updateUsername: (newUsername, password) => fetchData('/users/update-username', 'PATCH', { newUsername, password }),
  updateEmail: (newEmail, password) => fetchData('/users/update-email', 'PATCH', { newEmail, password }),
  resetPassword: () => fetchData('/users/reset-password', 'PATCH'),
  verifyEmail: (token) => fetchData(`/users/verify-email?token=${token}`, 'GET'),
  confirmResetPassword: (token, newPassword) => fetchData(`/users/verify-reset-password?token=${token}`, 'PATCH', { password: newPassword })
};