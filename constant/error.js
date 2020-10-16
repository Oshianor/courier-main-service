const API_ERRORS = Object.freeze({
  ACCOUNT_EXIST: "Account already exist.",
  ACCOUNT_CREATED: "Account successfully created.",
  ACCOUNT_INVALID: "Invalid email or password",
  NOT_FOUND: "Not Found",
  UPLOAD_IMAGE: "Image upload is required.",
  LOGGED_IN: "Successfully logged in",
  ACCESS_DENIED: "Access denied. No token provided.",
  SESSION_EXPIRED: "Access denied. Your session has expired",
  DEACTIVATED: "Your account isn't activate",
});


module.exports = API_ERRORS;