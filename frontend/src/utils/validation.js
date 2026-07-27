
const isValidUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 31;
const isValidPassword = (p) => p.length >= 6 && p.length <= 255;
const isValidToken = (t) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(t);

export {isValidUsername, isValidEmail, isValidPassword, isValidToken}