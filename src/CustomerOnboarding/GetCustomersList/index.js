const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');
const customerService = require('../../shared/dynamoDB/services/customerOnboarding');
/*=================get customers parameters validate==============*/
var statusValidator = Joi.object().keys({
    status: Joi.boolean().required()
})

//get customers list 
module.exports.handler = async (event) => {
    const query = (!event.queryStringParameters ? null : event.queryStringParameters);
    console.info("Event\n" + JSON.stringify(event, null, 2));
    //validate query parameter
    const { error, value } = await statusValidator.validate(query);
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        let status = (query.status == 'true') ? "Active" : "Inactive";
        customerData = await customerService.getAllCustomer(status)
        if (!customerData.error) {
            //if status true 
            if (query.status == "true") {
                // foreach loop to add parameters in response
                customerData.forEach(element => {
                    element['CreatedAt'] = 'abc',
                        element['UpdatedAt'] = 'xyz',
                        element['Age'] = 10
                });
            }

            console.info("Response\n" + JSON.stringify(customerData, null, 2));
            return success(200, customerData);
        } else {
            console.error("Error\n" + JSON.stringify(customerData.error, null, 2));
            return failure(400, "Bad Request", customerData.error);
        }
    }

}