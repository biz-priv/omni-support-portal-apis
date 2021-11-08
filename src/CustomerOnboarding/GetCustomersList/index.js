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
        _.filter(accountInfoResult, (elem) => {
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

function filterAllCustomerRecords(accountInfo, accountInfoResult) {
    _.filter(accountInfo, (element) => {
        _.filter(accountInfoResult, (elem) => {
            if (element.CustomerID == elem.CustomerID) {
                if (element.CustomerName) {
                    elem["CustomerName"] = element.CustomerName
                } else {
                    elem["CustomerName"] = "NA"
                }
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
        let batchItemParameters;

        let totalCount = 0;
        let totalActiveCount = 0;
        let page = _.get(event, 'queryStringParameters.page')
        let size = _.get(event, 'queryStringParameters.size')
        try {
            const fullRecords = await Dynamo.scanTableData(ACCOUNT_INFO_TABLE);
            if (fullRecords.length) {
                const filterActiveRecords = []
                totalCount = fullRecords.length;
                if (status === 'Active') {
                    _.filter(fullRecords, (element) => {
                        if (element.CustomerStatus == "Active") {
                            filterActiveRecords.push(element)
                        }
                    })
                    totalActiveCount = filterActiveRecords.length;
                    if (totalActiveCount) {
                        if (page > Math.ceil(totalActiveCount / size)) {
                            return send_response(404, handleError(1018))
                        }
                        const paginationResult = await getResponse(filterActiveRecords, totalActiveCount, page, size, _.get(event, 'queryStringParameters.status'), event);
                        apiGatewayRecords = await fetchApiKey(JSON.parse(paginationResult.body).Customers);
                        batchItemParameters = await filterParameters(apiGatewayRecords);
                        const fetchData = await Dynamo.fetchBatchItems(batchItemParameters, TOKEN_VALIDATOR_TABLE);
                        results = await filterRecords(fetchData.Responses[TOKEN_VALIDATOR_TABLE], apiGatewayRecords);
                        let finalResult = JSON.parse(paginationResult["body"]) 
                        finalResult["Customers"] = results 
                        return send_response(200, finalResult)
                    } else {
                        return send_response(400, handleError(1009))
                    }
                } else {
                    if (totalCount) {
                        if (page > Math.ceil(totalCount / size)) {
                            return send_response(404, handleError(1018))
                        }
                        const paginationResult = await getResponse(fullRecords, totalCount, page, size, _.get(event, 'queryStringParameters.status'), event);
                        apiGatewayRecords = await fetchApiKey(JSON.parse(paginationResult.body).Customers);
                        batchItemParameters = await filterParameters(apiGatewayRecords);
                        const fetchData = await Dynamo.fetchBatchItems(batchItemParameters, TOKEN_VALIDATOR_TABLE);
                        results = await filterAllCustomerRecords(fetchData.Responses[TOKEN_VALIDATOR_TABLE], apiGatewayRecords);
                        let finalResult = JSON.parse(paginationResult["body"]) 
                        finalResult["Customers"] = results
                        return send_response(200, finalResult)
                    } else {
                        return send_response(400, handleError(1009))
                    }
                }
            } else {
                const error = handleError(1009);
                console.error("Error: ", JSON.stringify(error));
                return send_response(error.httpStatus, error)
            }
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


async function getResponse(results, count, page, size, status, event) {
    let selfPageLink = "N/A";
    let host = "https://" + _.get(event, 'headers.Host', null) + "/" + _.get(event, 'requestContext.stage', 'devint');
    let path = _.get(event, 'path', null) + "?status=" + status + "&";
    selfPageLink = "page=" + page + "&size=" +
        size + "&startkey=" + _.get(event, 'queryStringParameters.startkey') 
    let startkey = "CustomerID"
    let endkey = null
    let responseArrayName = "Customers"
    var response = await pagination.createPagination(results, responseArrayName, startkey, endkey, host, path, page, size, count, selfPageLink);
    console.info("Response: ", JSON.stringify(response));
    return send_response(200, response);
}
