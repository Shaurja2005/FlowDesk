/**
 * Returns the user's avatar URL from either the profile sub-object or root fallback.
 * @param {Object} user - The user object
 * @returns {string|null} The avatar URL or null if none exists
 */
export const getUserAvatar = (user) => {
  if (!user) return null;
  return user.profile?.avatarUrl || user.avatar || null;
};
