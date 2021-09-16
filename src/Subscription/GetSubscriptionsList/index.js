const { send_response } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const { get } = require('lodash');
const EVENT_PREFERENCE = process.env.EVENT_PREFERENCES_TABLE;
const pagination = require('../../shared/utils/pagination');

//get webhooks subscriptions list
module.exports.handler = async (event) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        let startKey = { Customer_Id: get(event, 'queryStringParameters.startkey'), Event_Type: get(event, 'queryStringParameters.endkey') };
        let getItemResult, totalCount
        try {
            startKey = (startKey.Customer_Id == null || startKey.Customer_Id == 0) ? null : startKey;
            [getItemResult, totalCount] = await Promise.all([Dynamo.fetchAllItems(EVENT_PREFERENCE, get(event, 'queryStringParameters.size'), startKey), Dynamo.getAllItems(EVENT_PREFERENCE)]);
            return await getResponse(getItemResult, totalCount.Count, startKey, get(event, 'queryStringParameters.page'), get(event, 'queryStringParameters.size'), event);
        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return send_response(e.httpStatus, e);
        }
    } else {
        console.error("Error: ", JSON.stringify(event));
        return send_response(event.httpStatus, event);
    }

}

async function getResponse(results, count, startkey, page, size, event) {
    let resp = {}
    resp["Subscription"] = get(results, 'Items', []);

    let elementCount = resp['Subscription'].length;
    let deployStage = get(event, 'requestContext.stage', 'devint');
    let lastCustId = 0;
    let lastKey = 0;

    if (get(results, 'LastEvaluatedKey', null)) {
        lastCustId = get(results, 'LastEvaluatedKey.Customer_Id');
        lastKey = get(results, 'LastEvaluatedKey.Event_Type')
        var LastEvaluatedkey = "&startkey=" + lastCustId + "&endkey=" + lastKey;
    }

    let prevLinkStartKey = 0;
    let prevLinkEndKey = 0;
    if (startkey !== null) {
        prevLinkStartKey = startkey.Customer_Id;
        prevLinkEndKey = startkey.Event_Type;
    }

    let host = get(event, 'headers.Host', null) + "/" + deployStage;
    let path = get(event, 'path', null);
    let prevLink = host + path + "?page=" + page + "&size=" +
        size + "&startkey=" + prevLinkStartKey + "&endkey=" + prevLinkEndKey;

    var response = await pagination.createPagination(resp, host, path + "?page=", page, size, elementCount, LastEvaluatedkey, count, prevLink);

    if (lastCustId !== 0) {
        response.Page["StartKey"] = lastCustId;
        response.Page["EndKey"] = lastKey;
    }
    console.info("Response: ", JSON.stringify(response));
    return send_response(200, response);
}