const { send_response, handleError } = require('../../shared/utils/responses');
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
        let totalCount = 0;
        let page = get(event, 'queryStringParameters.page')
        let size = get(event, 'queryStringParameters.size')
        try {
            const fullRecords = await Dynamo.scanTableData(EVENT_PREFERENCE);
            if (fullRecords.length) {
                totalCount = fullRecords.length;
                if (page > Math.ceil(totalCount / size)) {
                    return send_response(400, handleError(1018))
                }
                return await getResponse(fullRecords, totalCount, page, size, event);
            } else {
                const error = handleError(1009);
                console.error("Error: ", JSON.stringify(error));
                return send_response(error.httpStatus, error)
            }
        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return send_response(e.httpStatus, e);
        }
    } else {
        console.error("Error: ", JSON.stringify(event));
        return send_response(event.httpStatus, event);
    }

}

async function getResponse(results, count, page, size, event) {
    let selfPageLink = "N/A";
    let host = "https://" + get(event, 'headers.Host', null) + "/" + get(event, 'requestContext.stage', 'devint');
    let path = get(event, 'path', null);
    selfPageLink = "?page=" + page + "&size=" +
        size + "&startkey=" + get(event, 'queryStringParameters.startkey') + "&endkey=" + get(event, 'queryStringParameters.endkey');
    let startkey = "Customer_Id"
    let endkey = "Event_Type"
    let responseArrayName = "Subscription"
    var response = await pagination.createPagination(results, responseArrayName, startkey, endkey, host, path, page, size, count, selfPageLink);
    console.info("Response: ", JSON.stringify(response));
    return send_response(200, response);
}
