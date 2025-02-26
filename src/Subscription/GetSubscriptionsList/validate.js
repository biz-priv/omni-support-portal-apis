const Joi = require('joi');
const get = require('lodash.get');
const { handleError } = require('../../shared/utils/responses');

const schema = Joi.object({
    queryStringParameters: Joi.object({
        page: Joi.number().integer().default(1),
        size: Joi.number().integer().default(10),
        startkey: Joi.string().when('page', { is: Joi.number().greater(1), then: Joi.string().not('0')}).default(0),
        endkey: Joi.string().when('page', { is: Joi.number().greater(1), then: Joi.string().not('0')}).default(0)
    }).empty(null).default({page: 1, size: 10, startkey: 0, endkey: 0}),
    headers: Joi.object().keys({
        "x-api-key": Joi.string().required()
    }).unknown(true),
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
