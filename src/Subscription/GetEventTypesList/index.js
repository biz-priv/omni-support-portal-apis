const { send_response } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const { get } = require('lodash');
const { handleError } = require('../../shared/utils/responses');
const EVENT_TOPIC = process.env.EVENT_TOPIC_TABLE;
const TOKEN_VALIDATOR = process.env.TOKEN_VALIDATOR_TABLE;


//get event types
module.exports.handler = async (event) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        try {
            const tokenTableResult = await Dynamo.queryByIndex(TOKEN_VALIDATOR, "ApiKeyindex", 'ApiKey = :apikey', { ':apikey': get(event, 'headers.x-api-key') });
            if ((tokenTableResult.Items).length) {
                const eventTypeResult = await Dynamo.getAllItems(EVENT_TOPIC);
                if ((eventTypeResult.Items).length) {
                    console.info("Response: ", JSON.stringify(eventTypeResult.Items));
                    return await send_response(200, eventTypeResult.Items);
                } else {
                    console.error("Error: ", JSON.stringify(handleError(1009)));
                    return await send_response(400, handleError(1009))
                }
            } else {
                console.error("Error: ", JSON.stringify(handleError(1014)));
                return await send_response(400, handleError(1014))
            }
        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return await send_response(e.httpStatus, e)
        }
    } else {
        console.error("Error: ", JSON.stringify(event));
        return await send_response(event.httpStatus, event);
    }

}
