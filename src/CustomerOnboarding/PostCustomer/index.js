const { success, failure } = require('../../shared/utils/responses');
const { createCustomerValidator } = require('../../shared/utils/vaildator');

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