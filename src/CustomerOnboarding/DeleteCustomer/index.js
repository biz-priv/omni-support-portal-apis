const { send_response, handleError } = require('../../shared/utils/responses');
const { customerIdValidator } = require('../../shared/utils/validator');
const Dynamo = require('../../shared/dynamo/db');
const TOKENVALIDATORTABLE = process.env.TOKEN_VALIDATOR;
const get = require('lodash.get');

//delete customer
module.exports.handler = async (event) => {

    console.info("Event\n" + JSON.stringify(event, null, 2));
    //validate customerId    
    event = await customerIdValidator(event);
    if (!event.code) {
        const testingPlan = await Dynamo.disassociateApiKeyFromUsagePlan();
        console.log(testingPlan);
        // const getResult = await Dynamo.getItem(TOKENVALIDATORTABLE, { 'CustomerID': get(event, 'body.CustomerId') });
        // if (getResult.Item) {
        //     console.log(getResult);
            return await send_response(202);
        // } else {
        //     const error = handleError(1009);
        //     console.error("Error: ", JSON.stringify(error));
        //     return await send_response(error.httpStatus, error)
        // }

    } else {
        console.error("Error: ", JSON.stringify(event));
        return await send_response(event.httpStatus, event)
    }

}