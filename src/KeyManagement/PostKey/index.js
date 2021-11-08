const { send_response } = require('../../shared/utils/responses');
const { customerIdValidator } = require('../../shared/utils/validator');
const Dynamo = require('../../shared/dynamo/db');
const TOKENVALIDATORTABLE = process.env.TOKEN_VALIDATOR;
const USAGEPLAN = process.env.USAGE_PLAN;
const get = require('lodash.get');
const { handleError } = require('../../shared/utils/responses');
const UpdateActivity = require('../../shared/utils/requestPromise');

//post key
module.exports.handler = async (event) => {

    console.info("Event: ", JSON.stringify(event, null, 2));
    //validate customerId    
    event = await customerIdValidator(event);
    if (!event.code) {
        try {
            let getItemResult = await Dynamo.getItemQueryFilter(TOKENVALIDATORTABLE, 'CustomerID = :hkey', 'CustomerStatus = :statuskey', { ':hkey': get(event, 'body.CustomerId'), ':statuskey': 'Active' });
            if ((getItemResult.Items).length) {
                const checkUsagePlan = await Dynamo.checkApiKeyUsagePlan(get(event, 'body.CustomerId'), USAGEPLAN);
                if (checkUsagePlan != undefined) {
                    return send_response(400, handleError(1013))
                }
                let apiKeyResult = await Dynamo.apiKeyCreate({ name: get(event, 'body.CustomerId'), enabled: true, description: get(event, 'body.CustomerId') }, USAGEPLAN);
                await Dynamo.itemInsert(TOKENVALIDATORTABLE, { "CustomerID": get(event, 'body.CustomerId'), "ApiKey": apiKeyResult.value, "CustomerStatus": 'Active', "CustomerName": getItemResult.Items[0].CustomerName })
                
                await UpdateActivity.postRequest(event, {"activity": "CreateApiKey", "description": get(event, 'body.CustomerId') + " For this Customer" })
                console.info("Info: ", JSON.stringify({ "ApiKey": apiKeyResult.value }));
                return send_response(200, { "ApiKey": apiKeyResult.value })
            }else {
                return send_response(400, handleError(1009))
            }
        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return send_response(e.httpStatus, e)
        }

    } else {
        console.error("Error: ", JSON.stringify(event));
        return send_response(event.httpStatus, event)
    }

}