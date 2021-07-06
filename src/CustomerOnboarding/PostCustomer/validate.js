const Joi = require('joi');
const get = require('lodash.get');
const { handleError } = require('../../shared/utils/responses');

const schema = Joi.object({
    BillToAccNumber: Joi.string().required(),
    SourceSystem: Joi.string().required(),
    CustomerNumber: Joi.string().default('NA'),
    DeclaredType: Joi.string().default('NA'),
    Station: Joi.string().default('NA'),
    CustomerName: Joi.string().default('NA')
})

async function validate(event) {
    try {
        event = await schema.validateAsync(event);
    } catch (e) {
        return handleError(1001, e, get(e, 'details[0].message', null));
    }
    return event;
}

module.exports = validate;
