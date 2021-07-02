const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');

/*=================create customer parameters validate==============*/
var createCustomerValidator = Joi.object().keys({
    Name: Joi.string().required(),
    BillToAccNumber: Joi.number().required(),
    CustomerNumber: Joi.number(),
    DeclaredType: Joi.string(),
    Station: Joi.string()
})


//post customer 
module.exports.handler = async (event) => {

    console.info("Event\n" + JSON.stringify(event, null, 2));
    const body = (!event.body ? null : JSON.parse(event.body));
    //validate body parameters
    const {error, value} = await createCustomerValidator.validate(body);
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        console.info("Response\n" + JSON.stringify(value, null, 2));
        return success(202);
    }
}