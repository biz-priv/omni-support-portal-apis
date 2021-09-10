const { send_response } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const { fetchApiKey } = require('./dynamoFunctions');
const pagination = require('../../shared/utils/pagination');
const { handleError } = require('../../shared/utils/responses');

const get = require('lodash.get');

const ACCOUNT_INFO_TABLE = process.env.ACCOUNT_INFO;
const TOKEN_VALIDATOR_TABLE = process.env.TOKEN_VALIDATOR;

function filterRecords(tokenTableRecords, accountInfoResult) {
    (tokenTableRecords.Items).map((element) => {
        accountInfoResult.map((elem) => {
            if (element.CustomerID == elem.CustomerID) {
                if (element.CustomerName) {
                    elem["CustomerName"] = element.CustomerName
                } else {
                    elem["CustomerName"] = "NA"
                }
            }
        })
    })
    return accountInfoResult
}

function filterCustomerID(tokenTableRecords){
    let batchItems = [];
    (tokenTableRecords.Items).map((elem) => {
        if(!batchItems.some(data => data.CustomerID === elem.CustomerID )){
            batchItems.push({"CustomerID": elem.CustomerID})
        }
    })
    return batchItems
}

module.exports.handler = async (event, context) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        const status = get(event, 'queryStringParameters.status') === true ? "Active" : "Inactive";
        let startKey = { CustomerID: get(event, 'queryStringParameters.startkey'), ApiKey: get(event, 'queryStringParameters.endkey') };
        let results, count, tokenTableRecords;
        let batchItemParameters;
        if (status === 'Active') {
            startKey["CustomerStatus"] = status;
            startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
            [tokenTableRecords, count] = await Promise.all(
                [Dynamo.fetchByIndex(TOKEN_VALIDATOR_TABLE, status, get(event, 'queryStringParameters.size'), startKey),
                Dynamo.getAllItemsQueryCount(TOKEN_VALIDATOR_TABLE, status)
                ]
            );
            batchItemParameters = await filterCustomerID(tokenTableRecords);
            const fetchData = await Dynamo.fetchBatchItems(batchItemParameters, ACCOUNT_INFO_TABLE);
            const newaccountInfoRecords = await filterRecords(tokenTableRecords, fetchData.Responses[ACCOUNT_INFO_TABLE]);
            let apiKeyParams = {
                "Items": newaccountInfoRecords
            }
            if(tokenTableRecords.LastEvaluatedKey){
                apiKeyParams["LastEvaluatedKey"] =  {"CustomerID": tokenTableRecords.LastEvaluatedKey.CustomerID, "ApiKey": tokenTableRecords.LastEvaluatedKey.ApiKey}   
            }
            results = await fetchApiKey(apiKeyParams);
        } else {
            startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
            [tokenTableRecords, count] = await Promise.all(
                [Dynamo.fetchAllItems(TOKEN_VALIDATOR_TABLE, get(event, 'queryStringParameters.size'), startKey),
                Dynamo.getAllItemsScanCount(TOKEN_VALIDATOR_TABLE)
                ]
            );
            batchItemParameters = await filterCustomerID(tokenTableRecords);
            const fetchData = await Dynamo.fetchBatchItems(batchItemParameters, ACCOUNT_INFO_TABLE);
            results = {
                "Items": await filterRecords(tokenTableRecords, fetchData.Responses[ACCOUNT_INFO_TABLE])
            };
            if(tokenTableRecords.LastEvaluatedKey){
                results["LastEvaluatedKey"] =  {"CustomerID": tokenTableRecords.LastEvaluatedKey.CustomerID, "ApiKey": tokenTableRecords.LastEvaluatedKey.ApiKey}   
            }
        }
        try {
            return await getResponse(results, count, startKey, get(event, 'queryStringParameters.status'), get(event, 'queryStringParameters.page'), get(event, 'queryStringParameters.size'), event);
        } catch (e) {
            console.error("Unknown error", e);
            const result = handleError(1005);
            return send_response(result.httpStatus, result);
        }
    } else {
        console.error("Error: ", JSON.stringify(event));
        return send_response(event.httpStatus, event)
    }
}

async function getResponse(results, count, startkey, status, page, size, event) {
    let resp = {}
    resp["Customers"] = get(results, 'Items', []);

    let elementCount = resp['Customers'].length;
    let deployStage = get(event, 'requestContext.stage', 'devint');
    let lastCustId = 0;
    let lastKey = 0;

    if (get(results, 'LastEvaluatedKey', null)) {
        lastCustId = get(results, 'LastEvaluatedKey.CustomerID');
        lastKey = get(results, 'LastEvaluatedKey.ApiKey')
        var LastEvaluatedkey = "&startkey=" + lastCustId + "&endkey=" + lastKey;
    }

    let prevLinkStartKey = 0;
    let prevLinkEndKey = 0;
    if (startkey !== null) {
        prevLinkStartKey = startkey.CustomerID;
        prevLinkEndKey = startkey.ApiKey;
    }

    let host = get(event, 'headers.Host', null) + "/" + deployStage;
    let path = get(event, 'path', null) + "?status=" + status;
    let prevLink = host + path + "&page=" + page + "&size=" +
        size + "&startkey=" + prevLinkStartKey + "&endkey=" + prevLinkEndKey;

    var response = await pagination.createPagination(resp, host, path + "&page=", page, size, elementCount, LastEvaluatedkey, count, prevLink);

    if (lastCustId !== 0) {
        response.Page["StartKey"] = lastCustId;
        response.Page["EndKey"] = lastKey;
    }
    console.info("Response: ", JSON.stringify(response));
    return send_response(200, response);
}
