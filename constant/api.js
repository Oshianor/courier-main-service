

const ACCOUNT_SERVICE = Object.freeze({
  // create/delete/get single user on the account service for commercial account
  USER: "/user",

  // create enterprise user account
  E_USER: "/user/enterpise",

  // get all user on the account service
  GET_ALL_USER: "/user/all",

  // get card details for user
  CARD: "/card",

  // get single card for enterprise
  E_CARD_SINGLE: "/card/enterprise/single",

  // get all card for an enterprise
  E_CARD_ALL: "/card/enterprise/all",

  // update user account
  UPDATE_USER: "/user/account",

  // get all the maintainers
  GET_MAINTAINERS: "/user/maintainers",

  // add card for enterprise
  ADD_E_CARD: "/card/enterprise",

  // user login for commercial
  LOGIN: "/auth/login",

  // verify account for enterprise
  VERIFY_ACCOUNT: "/auth/set-password",

  // update maintainers and branch account by enterprise owner
  TOGGLE_STATUS: "/auth/toggle-status",
});

module.exports = {
  ACCOUNT_SERVICE
};