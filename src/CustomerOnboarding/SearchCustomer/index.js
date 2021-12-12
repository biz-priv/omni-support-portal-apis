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
            delete elem["ApiKey"];
        })
    })
    return accountInfoResult
}

function filterAllCustomerRecords(tokenInfo, accountInfoResult, status) {
    let finalRecord = []
    _.filter(tokenInfo, (element) => {
        _.filter(accountInfoResult, (elem) => {
            if (element.CustomerID == elem.CustomerID) {
                if (!finalRecord.some(data => data.CustomerID === elem.CustomerID)) {
                    if(element["CustomerStatus"] == status ){
                        if(elem["CustomerStatus"] == status){
                        element["BillToAcct"] = elem.BillToAcct
                        element["SourceSystem"] = elem.SourceSystem
                        element["CustomerStatus"] = elem.CustomerStatus
                        element["Station"] = elem.Station
                        element["CustomerNo"] = elem.CustomerNo
                        element["DeclaredType"] = elem.DeclaredType
                        element["CustomerID"] = elem.CustomerID
                        delete element["ApiKey"]
                        finalRecord.push(element);
                        }
                    }
                }
            }
        })
    })
    return finalRecord
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
        let fetchRecords, batchItemParameters, fetchData, results, totalCount;
        let page = _.get(event, 'queryStringParameters.page')
        let size = _.get(event, 'queryStringParameters.size')
        const status = _.get(event, 'queryStringParameters.status') === true ? "Active" : "Inactive";
        try {
            if ((/^\d+$/.test(_.get(event, "pathParameters.id")))) {
                fetchRecords = await Dynamo.getAllItemsQueryFilter(ACCOUNT_INFO_TABLE, "contains(#customer_no, :customer_no) and #customer_status = :customer_status", { "#customer_no": "CustomerNo", "#customer_status": "CustomerStatus" }, { ":customer_no": (_.get(event, "pathParameters.id")).toString(), ":customer_status": status });
                if ((fetchRecords.Items).length) {
                    totalCount = fetchRecords.Items.length;
                    if (page > Math.ceil(totalCount / size)) {
                        return send_response(404, handleError(1018))
                    }
                    apiGatewayRecords = await fetchApiKey(fetchRecords.Items);
                    batchItemParameters = await filterParameters(apiGatewayRecords);
                    fetchData = await Dynamo.fetchBatchItems(batchItemParameters.batchPrimarySortKey, TOKEN_VALIDATOR_TABLE);
                    results = await filterRecords(fetchData.Responses[TOKEN_VALIDATOR_TABLE], apiGatewayRecords);
                    const paginationResult = await getResponse(results, totalCount, page, size, _.get(event, 'queryStringParameters.status'), event);
                    return send_response(200, JSON.parse(paginationResult["body"]))
                } else {
                    return send_response(400, handleError(1009))
                }
            } else {
                fetchRecords = await Dynamo.getAllItemsQueryFilter(TOKEN_VALIDATOR_TABLE, "contains(#customer_name, :customer_name) and #customer_status = :customer_status", { "#customer_name": "CustomerName", "#customer_status": "CustomerStatus" }, { ":customer_name": (_.get(event, "pathParameters.id")), ":customer_status": status });
                if ((fetchRecords.Items).length) {
                    apiGatewayRecords = await fetchApiKey(fetchRecords.Items);
                    batchItemParameters = filterParameters(apiGatewayRecords);
                    fetchData = await Dynamo.fetchBatchItems(batchItemParameters.batchPrimaryKey, ACCOUNT_INFO_TABLE);
                    results = filterAllCustomerRecords(apiGatewayRecords, fetchData.Responses[ACCOUNT_INFO_TABLE], status);
                    totalCount = results.length;
                    if(totalCount == 0){
                        return send_response(404, handleError(1009))
                    }
                    if (page > Math.ceil(totalCount / size)) {
                        return send_response(404, handleError(1018))
                    }
                    const paginationResult = await getResponse(results, totalCount, page, size, _.get(event, 'queryStringParameters.status'), event);
                    return send_response(200, JSON.parse(paginationResult["body"]))
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

async function getResponse(results, count, page, size, status, event) {
    let selfPageLink = "N/A";
    let host = "https://" + _.get(event, 'headers.Host', null) + "/" + _.get(event, 'requestContext.stage', process.env.stage);
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