const { send_response } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const SNS_SERVICE = require('../../shared/sns/sns');
const { get } = require('lodash');
const { handleError } = require('../../shared/utils/responses');
const EVENT_PREFERENCE = process.env.EVENT_PREFERENCES_TABLE;
const TOKEN_VALIDATOR = process.env.TOKEN_VALIDATOR_TABLE;
const UpdateActivity = require('../../shared/utils/requestPromise');

//delete webhooks
module.exports.handler = async (event) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        try {
            const tokenTableResult = await Dynamo.queryByIndex(TOKEN_VALIDATOR, "ApiKeyindex", 'ApiKey = :apikey', { ':apikey': get(event, 'headers.x-api-key') });
            if ((tokenTableResult.Items).length) {
                const eventPreferenceResult = await Dynamo.getItem(EVENT_PREFERENCE, { 'Customer_Id': tokenTableResult.Items[0].CustomerID, 'Event_Type': get(event, 'body.EventType') });
                if (eventPreferenceResult.Item) {
                    await SNS_SERVICE.topicUnSubscription(eventPreferenceResult.Item.Subscription_arn);
                    const [deletePreference] = await Promise.all([Dynamo.deleteItem(EVENT_PREFERENCE, { 'Customer_Id': tokenTableResult.Items[0].CustomerID, 'Event_Type': get(event, 'body.EventType') })]);

                    await UpdateActivity.postRequest(event, { "activity": "DeleteSubscription", "description": "Subscription " + eventPreferenceResult.Item.Subscription_arn + " deleted" })
                    return send_response(200);
                } else {
                    return send_response(400, handleError(1019))
                }
            } else {
                return send_response(400, handleError(1014))
            }
        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return send_response(e.httpStatus, e)
        }
    } else {
        console.error("Error: ", JSON.stringify(event));
        return send_response(event.httpStatus, event);
    }

}
