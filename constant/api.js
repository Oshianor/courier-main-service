const config = require("config");

const account = `${config.get("application.accountService")}/api/v1`;
const card = `${config.get("application.cardService")}/api/v1`;


const ACCOUNT_SERVICE = Object.freeze({
  // create/delete/get single user on the account service for commercial account
  USER: `${account}/user`,
  GET_USER: `${account}/user/findOne`,
  GET_USERS: `${account}/user/find`,

  // create enterprise user account
  E_USER: `${account}/user/enterpise`,

  // get all user on the account service
  GET_ALL_USER: `${account}/user/all`,

  // update user account
  UPDATE_USER: `${account}/user/account`,

  // get all the maintainers
  GET_MAINTAINERS: `${account}/user/maintainers`,

  // update maintainers and branch account by enterprise owner
  TOGGLE_STATUS: `${account}/auth/toggle-status`,

  // Get enterprise accounts - (ADMIN)
  GET_ENTERPRISE_ACCOUNTS: `${account}/enterprise/accounts`,

  ENTERPRISE_FINDONE: `${account}/enterprise/findone`,
  ENTERPRISE_FIND: `${account}/enterprise/find`,
  ENTERPRISE_COUNT: `${account}/enterprise/count`
});

const CARD_SERVICE = Object.freeze({
  // get card details for user
  CARD_FINDONE: `${card}/findone`,

  // get card details for user
  CARD_FIND: `${card}/find`
});


module.exports = {
  ACCOUNT_SERVICE,
  CARD_SERVICE,
};