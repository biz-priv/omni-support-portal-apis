const Joi = require('joi');

/*=========================create customer parameter validate==============*/
var createCustomerValidator = Joi.object().keys({
    Name: Joi.string().required(),
    BillToAccNumber: Joi.number().required(),
    CustomerNumber: Joi.number(),
    DeclaredType: Joi.string(),
    Station: Joi.string()
})

var updateCustomerValidator = Joi.object().keys({
    CustomerId: Joi.number().required(),
    Name: Joi.string(),
    BillToAccNumber: Joi.number(),
    CustomerNumber: Joi.number(),
    DeclaredType: Joi.string(),
    Station: Joi.string()
})

var customerIdValidator = Joi.object().keys({
    CustomerId: Joi.number().required()
})

var statusValidator = Joi.object().keys({
    status: Joi.boolean().required()
})

var createSubscriptionValidator = Joi.object().keys({
    CustomerName: Joi.string(), 
    Event: Joi.string(),
    Endpoint: Joi.string().pattern(new RegExp('^(https?:\\/\\/)?' + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + '((\\d{1,3}\\.){3}\\d{1,3}))'+  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ '(\\?[;&a-z\\d%_.~+=-]*)?'+ '(\\#[-a-z\\d_]*)?$','i')),
    SharedSecret: Joi.string()
})

var updateSubscriptionValidator = Joi.object().keys({
    CustomerId: Joi.number().required(),
    CustomerName: Joi.string(), 
    Event: Joi.string(),
    Endpoint: Joi.string().pattern(new RegExp('^(https?:\\/\\/)?' + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + '((\\d{1,3}\\.){3}\\d{1,3}))'+  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ '(\\?[;&a-z\\d%_.~+=-]*)?'+ '(\\#[-a-z\\d_]*)?$','i')),
    SharedSecret: Joi.string()
})

var updateUserActivityValidator = Joi.object().keys({
    CustomerId: Joi.number(),
    Type: Joi.string(),
    Timestamp: Joi.date().iso(),
    Description: Joi.string()
})

var userActivityIdValidator = Joi.object().keys({
    id: Joi.number().required()
})

/*============================================================= */
module.exports = {
    createCustomerValidator,
    updateCustomerValidator,
    customerIdValidator,
    statusValidator,
    createSubscriptionValidator,
    updateSubscriptionValidator,
    updateUserActivityValidator,
    userActivityIdValidator
}