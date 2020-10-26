const MSG_ERRORS = Object.freeze({
  ACCOUNT_EXIST: "Account already exist.",
  ACCOUNT_INVALID: "Invalid email or password",
  SUSPENDED: "Account is suspended!",
  INACTIVE: "Account is inactive!",
  NOT_FOUND: "Not Found",
  UPLOAD_IMAGE: "Image upload is required.",
  ACCESS_DENIED: "Access denied.",
  SESSION_EXPIRED: "Access denied. Your session has expired",
  DEACTIVATED: "Your account isn't activate",
  PERMISSION: "You don't have enough permission to perform this action",
  SERVER_ERROR: "Server Error!",
  FREEMIUM: "No Freemium pricing found.",
});

const MSG_SUCCESS = Object.freeze({
  ACCOUNT_CREATED: "Account Successfully Created.",
  LOGGED_IN: "Successfully logged in",
  DELETED: "Resource Deleted Successfully",
  UPDATED: "Resource Updated Successfully",
  CREATED: "Resource Created Successfully",
  FETCHED: "Resource Fetched Successfully",
  ACCOUNT_VERIFIED: "Account Successfully Verified",
});

const MSG_TYPES = Object.freeze({
  ACCOUNT_EXIST: "ACCOUNT_EXIST",
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  ACCOUNT_INVALID: "ACCOUNT_INVALID",
  NOT_FOUND: "NOT_FOUND",
  UPLOAD_IMAGE: "UPLOAD_IMAGE",
  LOGGED_IN: "LOGGED_IN",
  ACCESS_DENIED: "ACCESS_DENIED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  DEACTIVATED: "DEACTIVATED",
  PERMISSION: "PERMISSION",
  DELETED: "DELETED",
  UPDATED: "UPDATED",
  SERVER_ERROR: "SERVER_ERROR",
  CREATED: "CREATED",
  FETCHED: "FETCHED",
  FREEMIUM: "FREEMIUM",
  ACCOUNT_VERIFIED: "ACCOUNT_VERIFIED",
});

module.exports = {
  MSG_ERRORS,
  MSG_SUCCESS,
  MSG_TYPES,
};
