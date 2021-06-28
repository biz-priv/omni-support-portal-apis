const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');
const Dynamo = require('../../shared/dynamoDB/operations/dynamoOperations');
const { fetchApiKey } = require('./dynamoFunctions');
const pagination = require('../../shared/utils/pagination');
const ACCOUNTINFOTABLE = process.env.ACCOUNT_INFO;
// const TOKENVALIDATORTABLE = process.env.TOKEN_VALIDATOR;

/*=================get customers parameters validate==============*/
var statusValidator = Joi.object().keys({
    status: Joi.boolean().default(false),
    page: Joi.number().default(1),
    size: Joi.number().default(10),
    startkey: Joi.string().default(null)
})

//get customers list 
async function handler(event) {
    var query = (!event.queryStringParameters ? null : event.queryStringParameters);
    console.info("Event\n" + JSON.stringify(event, null, 2));
    if (query == null) { query = { status: 'false' } };

    //validate query parameter
    const { error, value } = await statusValidator.validate(query);
    if (error) {
        console.log("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        let status = (query.status == 'true') ? "Active" : "Inactive";
        let tableName = (ACCOUNTINFOTABLE ? ACCOUNTINFOTABLE : event.ACCOUNTINFOTABLE);
        let results

        let startKey = { "CustomerID": value.startkey }
        let totalCount = ""
        if (status == 'Active') {
            startKey["CustomerStatus"] = status
            startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
            const [accountInfo, totalRecords] = await Promise.all([Dynamo.fetchByIndex(tableName, status, value.size, startKey), Dynamo.getAllItemsQueryCount(tableName, status)]);
            results = await fetchApiKey(accountInfo);
            totalCount = totalRecords.data;
        } else {
            startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
            [results, totalRecords] = await Promise.all([Dynamo.fetchAllItems(tableName, value.size, startKey), Dynamo.getAllItemsScanCount(tableName)]);
            totalCount = totalRecords.data;
        }
        if (!results.error) {
            let resp = {}
                resp["Customers"] = results.data.Items

                let elementCount = (results.data.Items).length;
                let deployStage = event["requestContext"]["stage"];
                let lastCustomerId = 0
                if (results.data.LastEvaluatedKey) {
                    lastCustomerId = results.data.LastEvaluatedKey.CustomerID;
                    var LastEvaluatedkeyCustomerID = "&startkey=" + lastCustomerId;
                }   
                let prevLinkStartKey = 0
                if(value.startkey != null){
                    prevLinkStartKey = value.startkey    
                }
                let prevLink = event['headers']['Host'] + "/" + deployStage + event['path'] + "?status=" + value.status + "&page="+ value.page + "&size=" + value.size + "&startkey=" + prevLinkStartKey
                var response = await pagination.createPagination(resp, event['headers']['Host'] + "/" + deployStage, event['path'] + "?status=" + value.status, value.page, value.size, elementCount, LastEvaluatedkeyCustomerID, totalCount, prevLink);
                
                if(lastCustomerId != 0){
                    response.Page["StartKey"] = lastCustomerId;
                    if (value.status == true) {
                        response.Page["CustomerStatus"] = value.status;
                    }
                }

                console.info("Response\n" + JSON.stringify(response, null, 2));
                return success(200, response);
            
        } else { 
            console.log("Error\n" + JSON.stringify(results.error, null, 2));
            return failure(400, "Bad Request", results.error);
        }
    }
}

module.exports = {
    handler
}