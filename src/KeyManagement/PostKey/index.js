const { send_response } = require('../../shared/utils/responses');
const { customerIdValidator } = require('../../shared/utils/validator');
const Dynamo = require('../../shared/dynamo/db');
const TOKENVALIDATORTABLE = process.env.TOKEN_VALIDATOR;
const USAGEPLAN = process.env.USAGE_PLAN;
const get = require('lodash.get');


//post key
module.exports.handler = async (event) => {

    console.info("Event\n" + JSON.stringify(event, null, 2));
    //validate customerId    
    event = await customerIdValidator(event);
    if (!event.code) {
        try {
            let apiKeyResult = await Dynamo.apiKeyCreate({ name: get(event, 'body.CustomerId'), enabled: true, description: get(event, 'body.CustomerId') }, USAGEPLAN);
            await Dynamo.itemInsert(TOKENVALIDATORTABLE, { "CustomerID": get(event, 'body.CustomerId'), "ApiKey": apiKeyResult.value, "CustomerStatus": 'Active', "CustomerName": 'NA' })
            console.info("Info\n" + JSON.stringify({"ApiKey": apiKeyResult.value}))
            return await send_response(202, { "ApiKey": apiKeyResult.value })
        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return await send_response(e.httpStatus, e)
        }

    } else {
        console.error("Error: ", JSON.stringify(event));
        return await send_response(event.httpStatus, event)
    }

}