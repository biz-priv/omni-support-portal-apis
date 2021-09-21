const { send_response } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const { fetchApiKey } = require('./dynamoFunctions');
const pagination = require('../../shared/utils/pagination');
const { handleError } = require('../../shared/utils/responses');
const _ = require('lodash');

const ACCOUNT_INFO_TABLE = process.env.ACCOUNT_INFO;
const TOKEN_VALIDATOR_TABLE = process.env.TOKEN_VALIDATOR;

function filterRecords(accountInfo, accountInfoResult) {
    _.filter(accountInfo, (element) => {
        _.filter(accountInfoResult.Items, (elem) => {
            if (element.CustomerID == elem.CustomerID) {
                if (element.CustomerName) {
                    elem["CustomerName"] = element.CustomerName
                } else {
                    elem["CustomerName"] = "NA"
                }
            }
            delete elem["ApiKey"];
        })
    })
    return accountInfoResult
}

function filterAllCustomerRecords(accountInfo, accountInfoResult) {
    _.filter(accountInfo, (element) => {
        _.filter(accountInfoResult.Items, (elem) => {
            if (element.CustomerID == elem.CustomerID) {
                if (element.CustomerName) {
                    elem["CustomerName"] = element.CustomerName
                } else {
                    elem["CustomerName"] = "NA"
                }
                delete elem["ApiKey"];
                delete elem["Created"];
                delete elem["Updated"];
                delete elem["Age"];
            }
        })
    })
    return accountInfoResult
}

function filterParameters(accountInfo) {
    let batchItems = [];
    _.filter(accountInfo, (elem) => {
        if (!batchItems.some(data => data.CustomerID === elem.CustomerID)) {
            if (elem.ApiKey != "NA") {
                batchItems.push({ "CustomerID": elem.CustomerID, "ApiKey": elem.ApiKey })
            }
        }
    })
    return batchItems
}

module.exports.handler = async (event, context) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        const status = _.get(event, 'queryStringParameters.status') === true ? "Active" : "Inactive";
        let startKey = { CustomerID: _.get(event, 'queryStringParameters.startkey') };
        let results, count, accountInfo, apiGatewayRecords;
        let batchItemParameters;
        try {
            if (status === 'Active') {
                startKey["CustomerStatus"] = status;
                startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
                [accountInfo, count] = await Promise.all(
                    [Dynamo.fetchByIndex(ACCOUNT_INFO_TABLE, status, _.get(event, 'queryStringParameters.size'), startKey),
                    Dynamo.getAllItemsQueryCount(ACCOUNT_INFO_TABLE, status)
                    ]
                );
                apiGatewayRecords = await fetchApiKey(accountInfo);
                batchItemParameters = await filterParameters(apiGatewayRecords);
                const fetchData = await Dynamo.fetchBatchItems(batchItemParameters, TOKEN_VALIDATOR_TABLE);
                results = await filterRecords(fetchData.Responses[TOKEN_VALIDATOR_TABLE], accountInfo);
            } else {
                startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
                [accountInfo, count] = await Promise.all(
                    [Dynamo.fetchAllItems(ACCOUNT_INFO_TABLE, _.get(event, 'queryStringParameters.size'), startKey),
                    Dynamo.getAllItemsScanCount(ACCOUNT_INFO_TABLE)
                    ]
                );
                apiGatewayRecords = await fetchApiKey(accountInfo);
                batchItemParameters = await filterParameters(apiGatewayRecords);
                const fetchData = await Dynamo.fetchBatchItems(batchItemParameters, TOKEN_VALIDATOR_TABLE);
                results = await filterAllCustomerRecords(fetchData.Responses[TOKEN_VALIDATOR_TABLE], accountInfo);
            }
            return await getResponse(results, count, startKey, _.get(event, 'queryStringParameters.status'), _.get(event, 'queryStringParameters.page'), _.get(event, 'queryStringParameters.size'), event);
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
    resp["Customers"] = _.get(results, 'Items', []);

    let elementCount = resp['Customers'].length;
    let deployStage = _.get(event, 'requestContext.stage', 'devint');
    let lastCustomerId = 0;

    if (_.get(results, 'LastEvaluatedKey', null)) {
        lastCustomerId = _.get(results, 'LastEvaluatedKey.CustomerID');
        var LastEvaluatedkeyCustomerID = "&startkey=" + lastCustomerId;
    }

    let prevLinkStartKey = 0;
    if (startkey !== null) {
        prevLinkStartKey = startkey.CustomerID;
    }

    let host = _.get(event, 'headers.Host', null) + "/" + deployStage;
    let path = _.get(event, 'path', null) + "?status=" + status;
    let prevLink = host + path + "&page=" + page + "&size=" +
        size + "&startkey=" + prevLinkStartKey;

    var response = await pagination.createPagination(resp, host, path + "&page=", page, size, elementCount, LastEvaluatedkeyCustomerID, count, prevLink);

    if (lastCustomerId !== 0) {
        response.Page["StartKey"] = lastCustomerId;
        if (status == true) {
            response.Page["CustomerStatus"] = status;
        }
    }
    console.info("Response: ", JSON.stringify(response));
    return send_response(200, response);
}
