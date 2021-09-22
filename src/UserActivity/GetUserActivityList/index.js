const { send_response, handleError } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const USERACTIVITY = process.env.USER_ACTIVITY;
const pagination = require('../../shared/utils/pagination');
const _ = require('lodash');

//Get user activity
module.exports.handler = async (event) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        let totalCount = 0;
        let page = _.get(event, 'queryStringParameters.page')
        let size = _.get(event, 'queryStringParameters.size')
        try {
            const fullRecords = await Dynamo.scanTableData(USERACTIVITY);
            if (fullRecords.length) {
                const filterRecords = []
                _.filter(fullRecords, (element) => {
                    if (element.UserId == _.get(event, 'pathParameters.id')) {
                        filterRecords.push(element)
                    }
                })
                totalCount = filterRecords.length;
                if (totalCount) {
                    if (page > Math.ceil(totalCount / size)) {
                        return send_response(400, handleError(1018))
                    }
                    return await getResponse(filterRecords, totalCount, page, size, event);
                } else {
                    return send_response(400, handleError(1009))
                }
            } else {
                return send_response(400, handleError(1009))
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
    let startkey = "UserId"
    let endkey = "Timestamp"
    let responseArrayName = "Activity"
    var response = await pagination.createPagination(results, responseArrayName, startkey, endkey, host, path, page, size, count, selfPageLink);
    console.info("Response: ", JSON.stringify(response));
    return send_response(200, response);
}