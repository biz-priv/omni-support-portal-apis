const Joi = require("joi");
const get = require("lodash.get");
const { handleError } = require("../utils/responses");

const custom = Joi.extend((joi) => {
  return {
    type: "object",
    base: joi.object(),
    coerce(value, schema) {
      try {
        return { value: JSON.parse(value) };
      } catch (err) {
        return err;
      }
    },
  };
});

const customerIdSchema = Joi.object({
  body: custom.object({
    CustomerId: Joi.string().required(),
  }),
}).unknown(true);

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

/*=========================customer id validate==============*/
async function customerIdValidator(event) {
  try {
    return await customerIdSchema.validateAsync(event);
  } catch (e) {
    return handleError(1001, e, get(e, "details[0].message", null));
  }
}

async function createSubscriptionValidator(event) {
  try {
    return await createSubscriptionScema.validateAsync(event);
  } catch (e) {
    const msg = get(e, "details[0].message", null);
    return handleError(
      1001,
      e,
      JSON.stringify({
        errorDescription:
          msg == null ? null : msg.replace(new RegExp('"', "g"), ""),
      })
    );
  }
}

module.exports = {
  customerIdValidator,
  createSubscriptionValidator,
};
