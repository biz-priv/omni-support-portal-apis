const Joi = require("joi");
const get = require("lodash.get");
const { handleError } = require("../../shared/utils/responses");

const createSubscriptionScema = Joi.object().keys({
  EventType: Joi.string().required(),
  Preference: Joi.string().required(),
  Endpoint: Joi.string()
    .pattern(
      new RegExp(
        "^(https?:\\/\\/)?" +
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" +
          "((\\d{1,3}\\.){3}\\d{1,3}))" +
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
          "(\\?[;&a-z\\d%_.~+=-]*)?" +
          "(\\#[-a-z\\d_]*)?$",
        "i"
      )
    )
    .required(),
  SharedSecret: Joi.string().required(),
});
const createApikeyScema = Joi.object()
  .keys({
    "x-api-key": Joi.string().required(),
  })
  .unknown(true);

async function subscriptionValidator(event) {
  try {
    return await createSubscriptionScema.validateAsync(event);
  } catch (e) {
    const msg = get(e, "details[0].message", null);
    return handleError(1001, e, msg.replace(new RegExp('"', "g"), ""));
  }
}

async function apiKeyValidation(event) {
  try {
    return await createApikeyScema.validateAsync(event);
  } catch (e) {
    const msg = get(e, "details[0].message", null);
    return handleError(1001, e, msg.replace(new RegExp('"', "g"), ""));
  }
}

module.exports = {
  subscriptionValidator,
  apiKeyValidation,
};
