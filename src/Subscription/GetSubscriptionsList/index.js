const { send_response, handleError } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const _ = require('lodash');
const EVENT_PREFERENCE = process.env.EVENT_PREFERENCES_TABLE;
const pagination = require('../../shared/utils/pagination');
const { fetchApiKey } = require('./apigatewayFunction');

function filterFinalData(data) {
    let finalItems = [];
    _.filter(data, (elem) => {
            if (elem.ApiKey != "NA") {
                elem["Customer_Name"] = (elem["Customer_Name"] == undefined) ? "NA" : elem["Customer_Name"]
                finalItems.push(elem)
            }
    })
    return finalItems
}

//get webhooks subscriptions list
module.exports.handler = async (event) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        let totalCount = 0;
        let page = _.get(event, 'queryStringParameters.page')
        let size = _.get(event, 'queryStringParameters.size')
        try {
            const fullRecords = await Dynamo.scanTableData(EVENT_PREFERENCE);
            if (fullRecords.length) {
                let apiGatewayRecords = await fetchApiKey(fullRecords);
                let finalItems = filterFinalData(apiGatewayRecords)
                if(finalItems.length){
                    totalCount = finalItems.length;
                    if (page > Math.ceil(totalCount / size)) {
                        return send_response(404, handleError(1018))
                    }
                    return await getResponse(finalItems, totalCount, page, size, event);
                }else{
                    return send_response(404, handleError(1009))
                }
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
    let host = "https://" + _.get(event, 'headers.Host', null) + "/" + _.get(event, 'requestContext.stage', 'devint');
    let path = _.get(event, 'path', null) + "?";
    selfPageLink = "page=" + page + "&size=" +
        size + "&startkey=" + _.get(event, 'queryStringParameters.startkey') + "&endkey=" + _.get(event, 'queryStringParameters.endkey');
    let startkey = "Customer_Id"
    let endkey = "Event_Type"
    let responseArrayName = "Subscription"
    var response = await pagination.createPagination(results, responseArrayName, startkey, endkey, host, path, page, size, count, selfPageLink);
    console.info("Response: ", JSON.stringify(response));
    return send_response(200, response);
}
