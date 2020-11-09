const MSG_ERRORS = Object.freeze({
  ACCOUNT_EXIST: "Account already exist.",
  ACCOUNT_INVALID: "Invalid email or password",
  SUSPENDED: "Account is suspended!",
  INACTIVE: "Account is inactive!",
  DISABLED: "Account is disabled!",
  NOT_FOUND: "Not Found",
  UPLOAD_IMAGE: "Image upload is required.",
  ACCESS_DENIED: "Access denied.",
  SESSION_EXPIRED: "Access denied. Your session has expired",
  DEACTIVATED: "Your account isn't activate",
  PERMISSION: "You don't have enough permission to perform this action",
  SERVER_ERROR: "Server Error!",
  FREEMIUM: "No pricing found.",
  FAILED_SUPPORT:
    "We currently don't have support for this location. Please contact our support for assistance",
  ACCOUNT_DELETED: "Account no longer exists!",
  INVALID_PASSWORD: "Invalid Password",
});

const MSG_SUCCESS = Object.freeze({
  ACCOUNT_CREATED: "Account Successfully Created.",
  LOGGED_IN: "Successfully logged in",
  DELETED: "Resource Deleted Successfully",
  UPDATED: "Resource Updated Successfully",
  CREATED: "Resource Created Successfully",
  FETCHED: "Resource Fetched Successfully",
  ACCOUNT_VERIFIED: "Account Successfully Verified",
  ORDER_POSTED: "Order Successfully Posted",
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
  SUSPENDED: "SUSPENDED",
  SERVER_ERROR: "SERVER_ERROR",
  CREATED: "CREATED",
  FETCHED: "FETCHED",
  FREEMIUM: "FREEMIUM",
  ACCOUNT_VERIFIED: "ACCOUNT_VERIFIED",
  FAILED_SUPPORT: "FAILED_SUPPORT",
  ORDER_POSTED: "ORDER_POSTED",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  DISABLED: "DISABLED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
});

const ACCOUNT_TYPES = Object.freeze({
  ADMIN: "admin",
  COMPANY: "company",
  RIDER: "rider",
  USER: "user",
});

module.exports = {
  MSG_ERRORS,
  MSG_SUCCESS,
  MSG_TYPES,
  ACCOUNT_TYPES,
};
