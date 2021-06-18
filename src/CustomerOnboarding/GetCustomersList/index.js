const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');
const Dynamo = require('../../shared/dynamoDB/operations/dynamoOperations');

const ACCOUNTINFOTABLE = process.env.ACCOUNT_INFO;
const TOKENVALIDATORTABLE = process.env.TOKEN_VALIDATOR;

/*=================get customers parameters validate==============*/
var statusValidator = Joi.object().keys({
    status: Joi.boolean(),
    page: Joi.number(),
    size: Joi.number()
})

//get customers list 
async function handler(event){
    var query = (!event.queryStringParameters ? null : event.queryStringParameters);
    console.info("Event\n" + JSON.stringify(event, null, 2));
    if (query == null) {
        query = { status: 'false', page: 1, size: 10 }
    }
    //validate query parameter
    const { error, value } = await statusValidator.validate(query);
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        let status = (query.status == 'true') ? "Active" : "Inactive";
        let results
        if (status == 'Active') {
            let accountInfo = await Dynamo.searchTable(ACCOUNTINFOTABLE, 'Status', status);
            results = await Dynamo.fetchApiKey(TOKENVALIDATORTABLE, accountInfo);
        } else {
            results = await Dynamo.fetchAllCustomers(ACCOUNTINFOTABLE);
        }
        if (!results.error) {
            let response = {
                "Customers": results
            }
            console.info("Response\n" + JSON.stringify(response, null, 2));
            return success(200, response);
        } else {
            console.error("Error\n" + JSON.stringify(results.error, null, 2));
            return failure(400, "Bad Request", results.error);
        }
    }

}

module.exports = {
    handler
}