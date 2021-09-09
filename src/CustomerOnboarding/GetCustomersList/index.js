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
        (accountInfoResult.Items).map((elem) => {
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

module.exports.handler = async (event, context) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        const status = get(event, 'queryStringParameters.status') === true ? "Active" : "Inactive";
        let startKey = { CustomerID: get(event, 'queryStringParameters.startkey') };
        let results, accountInfo, count;
        let tokenTableRecords = await Dynamo.getAllItems(TOKEN_VALIDATOR_TABLE);
        if (status === 'Active') {
            startKey["CustomerStatus"] = status;
            startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
            [accountInfo, count] = await Promise.all(
                [Dynamo.fetchByIndex(ACCOUNT_INFO_TABLE, status, get(event, 'queryStringParameters.size'), startKey),
                Dynamo.getAllItemsQueryCount(ACCOUNT_INFO_TABLE, status)
                ]
            );
            const newaccountInfoRecords = await filterRecords(tokenTableRecords, accountInfo);
            results = await fetchApiKey(newaccountInfoRecords);
        } else {
            startKey = (startKey.CustomerID == null || startKey.CustomerID == 0) ? null : startKey;
            [accountInfoResult, count] = await Promise.all(
                [Dynamo.fetchAllItems(ACCOUNT_INFO_TABLE, get(event, 'queryStringParameters.size'), startKey),
                Dynamo.getAllItemsScanCount(ACCOUNT_INFO_TABLE)
                ]
            );
            results = await filterRecords(tokenTableRecords, accountInfoResult);
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
    let lastCustomerId = 0;

    if (get(results, 'LastEvaluatedKey', null)) {
        lastCustomerId = get(results, 'LastEvaluatedKey.CustomerID');
        var LastEvaluatedkeyCustomerID = "&startkey=" + lastCustomerId;
    }

    let prevLinkStartKey = 0;
    if (startkey !== null) {
        prevLinkStartKey = startkey.CustomerID;
    }

    let host = get(event, 'headers.Host', null) + "/" + deployStage;
    let path = get(event, 'path', null) + "?status=" + status;
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
