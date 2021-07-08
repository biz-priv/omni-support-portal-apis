const Joi = require('joi');
const get = require('lodash.get');
const { handleError } = require('../utils/responses');

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

const customerIdSchema = Joi.object({
    body : custom.object({
        CustomerId: Joi.string().required()
    })
}).unknown(true);

const userActivityIdSchema = Joi.object({
    pathParameters: Joi.object({
        id: Joi.number().required()
    })
}).unknown(true);

/*=========================customer id validate==============*/
async function customerIdValidator(event){
    try{
        event = await customerIdSchema.validateAsync(event);
    } catch(e){
         return await handleError(1001, e, get(e, 'details[0].message', null));
    }
    return event;
}

/*=========================user activity id validate==============*/
async function userActivityIdValidator(event){
    try{
        event = await userActivityIdSchema.validateAsync(event);
    } catch(e){
        return handleError(1001, e, get(e, 'details[0].message', null));
    }
    return event;
}

module.exports = {
    customerIdValidator,
    userActivityIdValidator
}