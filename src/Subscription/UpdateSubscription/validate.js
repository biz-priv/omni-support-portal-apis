const Joi = require('joi');
const get = require('lodash.get');
const { handleError } = require('../../shared/utils/responses');

const custom = Joi.extend((joi) => {
    return {
        type: 'object',
        base: joi.object(),
        coerce(value, schema) {
            try {
                return { value: JSON.parse(value) };
            }
            catch (err) {
                return err;
            }
        }
    };
});

const schema = Joi.object({
    headers: Joi.object().keys({
        "x-api-key": Joi.string().required()
    }).unknown(true),
    body: custom.object({
        Preference: Joi.any().valid('fullPayload', 'Change'),
        EventType: Joi.string().required(),
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
            ),
        SharedSecret: Joi.string(),
    })
}).unknown(true)

async function validate(event) {
    try {
        event = await schema.validateAsync(event);
    } catch (e) {
        return handleError(1001, e, get(e, 'details[0].message', null));
    }
    return event;
}

module.exports = validate;
