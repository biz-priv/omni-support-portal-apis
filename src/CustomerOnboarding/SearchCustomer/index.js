const { send_response } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const { fetchApiKey } = require('./dynamoFunctions');
const { handleError } = require('../../shared/utils/responses');
const _ = require('lodash');

const ACCOUNT_INFO_TABLE = process.env.ACCOUNT_INFO;
const TOKEN_VALIDATOR_TABLE = process.env.TOKEN_VALIDATOR;

function filterRecords(accountInfo, accountInfoResult) {
    _.filter(accountInfo, (element) => {
        _.filter(accountInfoResult, (elem) => {
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
        _.filter(accountInfoResult, (elem) => {
            if (element.CustomerID == elem.CustomerID) {
                if (element.CustomerName) {
                    elem["CustomerName"] = element.CustomerName
                    elem["Created"] = element.Created
                    elem["Updated"] = element.Updated
                    elem["Age"] = element.Age
                } else {
                    elem["CustomerName"] = "NA"
                }
                delete elem["ApiKey"];
            }
        })
    })
    return accountInfoResult
}

function filterParameters(accountInfo) {
    let batchPrimarySortKey = [];
    let batchPrimaryKey = []
    _.filter(accountInfo, (elem) => {
        if (!batchPrimarySortKey.some(data => data.CustomerID === elem.CustomerID)) {
            if (elem.ApiKey != "NA") {
                batchPrimarySortKey.push({ "CustomerID": elem.CustomerID, "ApiKey": elem.ApiKey })
                batchPrimaryKey.push({ "CustomerID": elem.CustomerID })
            }
        }
    })
    return { "batchPrimarySortKey": batchPrimarySortKey, "batchPrimaryKey": batchPrimaryKey }
}


module.exports.handler = async (event, context) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        let fetchRecords, batchItemParameters, fetchData, results;
        try {
            if (typeof (_.get(event, "pathParameters.id")) === "number") {
                fetchRecords = await Dynamo.getAllItemsQueryFilter(ACCOUNT_INFO_TABLE, "contains(#customer_no, :customer_no)", { "#customer_no": "CustomerNo", }, { ":customer_no": (_.get(event, "pathParameters.id")).toString(), });
                if ((fetchRecords.Items).length) {
                    apiGatewayRecords = await fetchApiKey(fetchRecords.Items);
                    batchItemParameters = filterParameters(apiGatewayRecords);
                    fetchData = await Dynamo.fetchBatchItems(batchItemParameters.batchPrimarySortKey, TOKEN_VALIDATOR_TABLE);
                    results = {
                        "Customers": await filterRecords(fetchData.Responses[TOKEN_VALIDATOR_TABLE], apiGatewayRecords)
                    }
                    return send_response(200, results)
                } else {
                    return send_response(400, handleError(1009))
                }
            } else {
                fetchRecords = await Dynamo.getAllItemsQueryFilter(TOKEN_VALIDATOR_TABLE, "contains(#customer_name, :customer_name)", { "#customer_name": "CustomerName", }, { ":customer_name": (_.get(event, "pathParameters.id")), });
                if ((fetchRecords.Items).length) {
                    apiGatewayRecords = await fetchApiKey(fetchRecords.Items);
                    batchItemParameters = filterParameters(apiGatewayRecords);
                    fetchData = await Dynamo.fetchBatchItems(batchItemParameters.batchPrimaryKey, ACCOUNT_INFO_TABLE);
                    results = {
                        "Customers": await filterAllCustomerRecords(apiGatewayRecords, fetchData.Responses[ACCOUNT_INFO_TABLE])
                    }
                    return send_response(200, results)
                } else {
                    return send_response(400, handleError(1009))
                }
            }
        } catch (e) {
            console.error("Unknown error", e);
            return send_response(400, handleError(1005));
        }
    } else {
        console.error("Error: ", JSON.stringify(event));
        return send_response(event.httpStatus, event)
    }
}