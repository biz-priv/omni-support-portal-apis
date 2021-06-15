const { success, failure } = require('../../../shared/utils/responses');
const { createCustomerValidator } = require('../../../shared/utils/vaildator');

//post customer 
module.exports.handler = async (event) => {

    const body = (!event.body ? null : JSON.parse(event.body));
    //validate body parameters
    const {error, value} = await createCustomerValidator.validate(body);
    if (error) {
        return failure(400, "missing required parameters", error);
    } else {
        return success(202);
    }
}