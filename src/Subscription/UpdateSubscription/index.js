const { send_response, handleError } = require('../../shared/utils/responses');
const Dynamo = require('../../shared/dynamo/db');
const validate = require('./validate');
const get = require('lodash.get');
const TOKEN_VALIDATOR = process.env.TOKEN_VALIDATOR
const EVENTING_TOPICS_TABLE = process.env.EVENTING_TOPICS_TABLE;
const CUSTOMER_PREFERENCE_TABLE = process.env.CUSTOMER_PREFERENCE_TABLE;
const UpdateActivity = require('../../shared/utils/requestPromise');

//update subscription
module.exports.handler = async (event) => {

    console.info("Event\n" + JSON.stringify(event, null, 2));
    event = await validate(event);
    if (!event.code) {
        try {
            const result = await Dynamo.getAllItemsQueryFilter(TOKEN_VALIDATOR, "#ApiKey = :ApiKey", { "#ApiKey": "ApiKey" }, { ":ApiKey": get(event, "headers.x-api-key") });
            if ((result.Items).length) {
                const eventTypes = await Dynamo.getItem(EVENTING_TOPICS_TABLE, { Event_Type: get(event, "body.EventType") });
                if (eventTypes.Item) {
                    const preferenceResult = await Dynamo.getAllItemsQueryFilter(
                        CUSTOMER_PREFERENCE_TABLE,
                        "#Customer_Id = :Customer_Id and #Event_Type = :Event_Type",
                        {
                            "#Customer_Id": "Customer_Id",
                            "#Event_Type": "Event_Type",
                        },
                        {
                            ":Customer_Id": result.Items[0].CustomerID,
                            ":Event_Type": eventTypes.Item.Event_Type,
                        }
                    );
                    if ((preferenceResult.Items).length) {
                        const splitdata = (preferenceResult.Items[0].Subscription_arn).split(":")
                        let subscriptionARN
                        if (get(event, "body.Preference") == "fullPayload") {
                            subscriptionARN = eventTypes.Item.Full_Payload_Topic_Arn + ":" + splitdata[(splitdata.length - 1)]
                        } else {
                            subscriptionARN = eventTypes.Item.Event_Payload_Topic_Arn + ":" + splitdata[(splitdata.length - 1)]
                        }
                        await Dynamo.updateItems(CUSTOMER_PREFERENCE_TABLE, { 'Customer_Id': result.Items[0].CustomerID, 'Event_Type': eventTypes.Item.Event_Type }, 'set Subscription_Preference = :x, Endpoint = :endpt, Shared_Secret = :y, Subscription_arn = :subARN ', { ':x': get(event, "body.Preference"), ':endpt': get(event, "body.Endpoint"), ':y': get(event, "body.SharedSecret"), ':subARN': subscriptionARN  })

                        await UpdateActivity.postRequest(event, { "activity": "UpdateSubscription", "description": "Subscription " + subscriptionARN + " Updated" })
                        return send_response(202);
                    } else {
                        return send_response(400, handleError(1020));
                    }
                } else {
                    return send_response(400, handleError(1019));
                }
            } else {
                return send_response(400, handleError(1009));
            }

        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return send_response(e.httpStatus, e)
        }

    } else {
        console.error("Error: ", JSON.stringify(event));
        return send_response(event.httpStatus, event)
    }

}