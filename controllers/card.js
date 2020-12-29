
const CardService = require("../services/card")
const { validateCard, validateCardId } = require("../request/card");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");

// instantiate card class
const cardInstance = new CardService();


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


exports.all = async (req, res, next) => {
  try {
    const cards = await cardInstance.getAll(req.body);
    JsonResponse(res, 200, MSG_TYPES.FETCHED, cards, null);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

exports.single = async (req, res, next) => {
  try {
    const { error } = validateCardId(req.query);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const card = await cardInstance.get(req.query.cardId);
    JsonResponse(res, 200, MSG_TYPES.FETCHED, card, null);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

