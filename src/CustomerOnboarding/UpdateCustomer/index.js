const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');

/*=================update customer parameters validate==============*/
var updateCustomerValidator = Joi.object().keys({
    CustomerId: Joi.number().required(),
    Name: Joi.string(),
    BillToAccNumber: Joi.number(),
    CustomerNumber: Joi.number(),
    DeclaredType: Joi.string(),
    Station: Joi.string()
})

//update customer
module.exports.handler = async (event) => {

    console.info("Event\n" + JSON.stringify(event, null, 2));
    const body = (!event.body ? null : JSON.parse(event.body));
    //validate customerId
    const {error, value} = await updateCustomerValidator.validate(body);
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        console.info("Response\n" + JSON.stringify(value, null, 2));
        return success(202);
    }

}