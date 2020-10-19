const { object } = require("joi");

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
  PERMISSION: "You don't have enough permission to perform this action",
});

const MSG_ERRORS = Object.freeze({
  ACCOUNT_EXIST: "Account already exist.",
  ACCOUNT_CREATED: "Account successfully created.",
  ACCOUNT_INVALID: "Invalid email or password",
  NOT_FOUND: "Not Found",
  UPLOAD_IMAGE: "Image upload is required.",
  LOGGED_IN: "Successfully logged in",
  ACCESS_DENIED: "Access denied. No token provided.",
  SESSION_EXPIRED: "Access denied. Your session has expired",
  DEACTIVATED: "Your account isn't activate",
  PERMISSION: "You don't have enough permission to perform this action",
});

const MSG_SUCCESS = Object.freeze({
  ACCOUNT_EXIST: "Account already exist.",
  ACCOUNT_CREATED: "Account successfully created.",
  ACCOUNT_INVALID: "Invalid email or password",
  NOT_FOUND: "Not Found",
  UPLOAD_IMAGE: "Image upload is required.",
  LOGGED_IN: "Successfully logged in",
  ACCESS_DENIED: "Access denied. No token provided.",
  SESSION_EXPIRED: "Access denied. Your session has expired",
  DEACTIVATED: "Your account isn't activate",
  PERMISSION: "You don't have enough permission to perform this action",
});

MSG_TYPES = {
  ACCOUNT_EXIST: "ACCOUNT_EXIST",
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  ACCOUNT_INVALID: "ACCOUNT_INVALID",
  NOT_FOUND: " NOT_FOUND",
  UPLOAD_IMAGE: "UPLOAD_IMAGE",
  LOGGED_IN: "LOGGED_IN",
  ACCESS_DENIED: "ACCESS_DENIED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  DEACTIVATED: "DEACTIVATED",
  PERMISSION: "PERMISSION",
};

module.exports = {
  MSG_ERRORS,
  MSG_SUCCESS,
  MSG_TYPES,
};
