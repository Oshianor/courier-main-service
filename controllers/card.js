
const CardService = require("../services/card")
const { validateCard, validateCardId } = require("../request/card");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");

// instantiate card class
const cardInstance = new CardService();

// add a card
exports.add = async (req, res, next) => {
  try {
    const { error } = validateCard(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    await cardInstance.addCard(req.body);
    JsonResponse(res, 200, "Card successfully added");
    return;
  } catch (error) {
    next(error);
    return;
  }
};

// get all company card
exports.all = async (req, res, next) => {
  try {
    const cards = await cardInstance.getAll(req.body);
    JsonResponse(res, 200, MSG_TYPES.FETCHED, cards);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

// Get card details by id
exports.single = async (req, res, next) => {
  try {
    const { error } = validateCardId(req.params);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const card = await cardInstance.getCard(req.params.cardId);
    JsonResponse(res, 200, MSG_TYPES.FETCHED, card);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

// Delete a card by id
exports.delete = async (req, res, next) => {
  try {
    const { error } = validateCardId(req.params);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const card = await cardInstance.delete(req.params.cardId);
    JsonResponse(res, 200, MSG_TYPES.DELETED);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

