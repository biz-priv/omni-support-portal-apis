const Joi = require('joi');

/*=========================customer id validate==============*/
var customerIdValidator = Joi.object().keys({
    CustomerId: Joi.number().required()
})

/*=========================user activity id validate==============*/
var userActivityIdValidator = Joi.object().keys({
    id: Joi.number().required()
})

module.exports = {
    customerIdValidator,
    userActivityIdValidator
}