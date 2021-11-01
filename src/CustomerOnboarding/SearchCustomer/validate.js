const Joi = require('joi');
const get = require('lodash.get');
const { handleError } = require('../../shared/utils/responses');

const schema = Joi.object({
    pathParameters: Joi.object({
        id: Joi.alternatives().try(Joi.number(), Joi.string()).required()
    }),
    queryStringParameters: Joi.object({
        page: Joi.number().integer().default(1),
        size: Joi.number().integer().min(1).max(10).default(10),
        status: Joi.boolean().default(false),
        startkey: Joi.string().when('page', { is: Joi.number().greater(1), then: Joi.string().not('0') }).default(0)
    }).empty(null).default({ page: 1, size: 10, status: false, startkey: 0 })
}).unknown(true);

async function validate(event) {
    try {
        event = await schema.validateAsync(event);
    } catch (e) {
        return handleError(1001, e, get(e, 'details[0].message', null));
    }
    return event;
}

module.exports = validate;
