const Joi = require('joi');
const get = require('lodash.get');
const { handleError } = require('../../shared/utils/responses');

const schema = Joi.object({
    pathParameters: Joi.object({
        id: Joi.alternatives().try(Joi.number(), Joi.string()).required()
    })
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
