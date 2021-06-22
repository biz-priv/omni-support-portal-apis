const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');
const Dynamo = require('../../shared/dynamoDB/operations/dynamoOperations');
const pagination = require('../../shared/utils/pagination');
const ACCOUNTINFOTABLE = process.env.ACCOUNT_INFO;
// const ACCOUNTINFOTABLE = 'omni-dw-account-info-dev'
// const TOKENVALIDATORTABLE = process.env.TOKEN_VALIDATOR;

/*=================get customers parameters validate==============*/
var statusValidator = Joi.object().keys({
    status: Joi.boolean(),
    page: Joi.number(),
    size: Joi.number()
})
var AWS = require('aws-sdk');

var options = {
    region: process.env.REGION,
};
var documentClient = new AWS.DynamoDB.DocumentClient(options);


//get customers list 
async function handler(event){
    var query = (!event.queryStringParameters ? null : event.queryStringParameters);
    console.info("Event\n" + JSON.stringify(event, null, 2));
    if (query == null) {
        query = { status: 'false', page: 1, size: 2 }
    }
    //validate query parameter
    const { error, value } = await statusValidator.validate(query);
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        let status = (query.status == 'true') ? "Active" : "Inactive";
        let tableName = (ACCOUNTINFOTABLE ? ACCOUNTINFOTABLE : event.ACCOUNTINFOTABLE);
        let results
        if (status == 'Active') {
            let accountInfo = await Dynamo.searchTable(tableName, 'Status', status);
            results = await Dynamo.fetchApiKey(accountInfo);
        } else {
            results = await Dynamo.getCustomer({TableName: tableName, Limit: query.size });
        }

        if (!results.error) {
            let response = {
                "Customers": results.data.Items,
            }
            var wuerydata = await pagination.searchBlogByTitle(results.data, query.size, results.data.LastEvaluatedKey);
            console.log("======================================================")
            console.log(wuerydata);
            console.log("======================================================")
            if(results.data.LastEvaluatedKey){
               response["nextUrl"] = event['headers']['Host'] + event['path'] + "/?status=" + query.status + "&page=" + query.page + "&size=" + query.size;
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