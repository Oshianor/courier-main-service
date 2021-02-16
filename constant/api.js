const account = "http://localhost:6000/api/v1";
const card = "http://localhost:6002/api/v1";

const ACCOUNT_SERVICE = Object.freeze({
  // create/delete/get single user on the account service for commercial account
  USER: `${account}/user`,

  // create enterprise user account
  E_USER: `${account}/user/enterpise`,

  // get all user on the account service
  GET_ALL_USER: `${account}/user/all`,

  // update user account
  UPDATE_USER: `${account}/user/account`,

  // get all the maintainers
  GET_MAINTAINERS: `${account}/user/maintainers`,

  // update maintainers and branch account by enterprise owner
  TOGGLE_STATUS: "/auth/toggle-status",
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