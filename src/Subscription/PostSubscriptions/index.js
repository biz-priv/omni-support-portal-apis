const { send_response, handleError } = require("../../shared/utils/responses");
const Joi = require("joi");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const Dynamo = require("../../shared/dynamo/db");
const validate = require("./validate");
const get = require("lodash.get");

const TOKEN_VALIDATOR = process.env.TOKEN_VALIDATOR;
const CUSTOMER_PREFERENCE_TABLE = process.env.CUSTOMER_PREFERENCE_TABLE;
const EVENTING_TOPICS_TABLE = process.env.EVENTING_TOPICS_TABLE;

/*=================post subscription==============*/
module.exports.handler = async (event) => {
  event = await validate(event);
  try {
    if (event.code) {
      console.error("Error: ", JSON.stringify(event));
      return await send_response(event.httpStatus, event);
    } else {
      const ApiKey = get(event, "headers.x-api-key");
      const customerId = await getCustomerId(ApiKey);
      if(customerId == false){
        const error = handleError(1014, null ,"Customer doesn't exist");
        console.error("Error: ", JSON.stringify(error));
        return await send_response(error.httpStatus, error)
      }else{
      const customerSub = await getCustomerPreference(
        customerId,
        get(event, "body.EventType"),
        get(event, "body.Preference")
      );
      if (customerSub == false) {
        const error = handleError(1017);
        console.error("Error: ", JSON.stringify(error));
        return await send_response(error.httpStatus, error)
      } else {
        // preference check
        const snsTopicDetails = await getSnsTopicDetails(get(event, "body.EventType"));
        let subscriptionArn = snsTopicDetails.Event_Payload_Topic_Arn;
        if (get(event, "body.Preference") == "fullPayload") {
          subscriptionArn = snsTopicDetails.Full_Payload_Topic_Arn;
        }

        await createCustomerPreference(customerId, event, subscriptionArn);

        //Create an SNS subscription with filter policy as CustomerID.
        await subscribeToTopic(subscriptionArn, get(event, "body.Endpoint"), customerId);
      }
      return send_response(200, { message: "Subscription successfully added" });
    }
    }
  } catch (error) {
    const err = handleError(1005, null, error);
    console.error("Error: ", JSON.stringify(err));
    return await send_response(error.httpStatus, err)
  } 
};

function generateErrorMsg(params, errorType, defaultErrorMsg) {
  return (
    errorType +
    ": " +
    (typeof params === "string" || params instanceof String
      ? params
      : defaultErrorMsg)
  );
}

/**
 * Get the CustomerID based on ApiKey from token validator table
 * @param {*} ApiKey
 * @returns
 */
async function getCustomerId(ApiKey) {
  try {
    const response = await Dynamo.getAllItemsQueryFilter(
      TOKEN_VALIDATOR,
      "#ApiKey = :ApiKey",
      { "#ApiKey": "ApiKey" },
      { ":ApiKey": ApiKey }
    );
    if (
      response.Items &&
      response.Items.length > 0 &&
      response.Items[0].CustomerID
    ) {
      return response.Items[0].CustomerID;
    }else {
      return false
    }
  } catch (error) {
    throw generateErrorMsg(error, "getCustomerIdError", "Something went wrong");
  }
}

/**
 * Check in event preferences table for existing subscription based on
 * Event_Type and Subscription_Preference
 * @param {*} custId
 * @param {*} snsEventType
 * @param {*} subscriptionPreference
 * @returns
 */
async function getCustomerPreference(
  Customer_Id,
  Event_Type,
  Subscription_Preference
) {
  try {
    const response = await Dynamo.getAllItemsQueryFilter(
      CUSTOMER_PREFERENCE_TABLE,
      "#Customer_Id = :Customer_Id and #Event_Type = :Event_Type and #Subscription_Preference = :Subscription_Preference",
      {
        "#Customer_Id": "Customer_Id",
        "#Event_Type": "Event_Type",
        "#Subscription_Preference": "Subscription_Preference",
      },
      {
        ":Customer_Id": Customer_Id,
        ":Event_Type": Event_Type,
        ":Subscription_Preference": Subscription_Preference,
      }
    );
    if (
      response.Items &&
      response.Items.length > 0 &&
      response.Items[0].Subscription_Preference
    ) {
      return true;
    }
    return false;
  } catch (error) {
    throw generateErrorMsg(
      error,
      "getCustomerPreferenceError",
      "Something went wrong"
    );
  }
}

/**
 * Get the SNS topic details from event topics table based on Event_Type and Preference
 * @param {*} snsEventType
 * @param {*} preference
 * @returns
 */
async function getSnsTopicDetails(eventType) {
  try {
    const response = await Dynamo.getItem(EVENTING_TOPICS_TABLE, {
      Event_Type: eventType,
    });
    return {
      Event_Payload_Topic_Arn: response.Item.Event_Payload_Topic_Arn,
      Full_Payload_Topic_Arn: response.Item.Full_Payload_Topic_Arn,
    };
  } catch (error) {
    throw generateErrorMsg(
      error,
      "getSnsTopicDetailsError",
      "Something went wrong"
    );
  }
}

/**
 * create Customer Preference
 * @param {*} custId
 * @param {*} eventBody
 * @param {*} arnResponse
 * @returns
 */
async function createCustomerPreference(custId, eventBody, subscriptionArn) {
  try {
    await Dynamo.itemInsert(CUSTOMER_PREFERENCE_TABLE, {
      Event_Type: get(eventBody, "body.EventType"),
      Subscription_Preference: get(eventBody, "body.Preference"),
      Customer_Id: custId,
      Endpoint: get(eventBody, "body.Endpoint"),
      Shared_Secret: get(eventBody, "body.SharedSecret"),
      Subscription_arn: subscriptionArn,
    });
    return true;
  } catch (error) {
    throw generateErrorMsg(
      error,
      "createCustomerPreferenceError",
      "Unable to create customer"
    );
  }
}

/**
 *
 * @param {*} topic_arn
 * @param {*} endpoint
 * @param {*} customer_id
 * @returns
 */
async function subscribeToTopic(topic_arn, endpoint, customer_id) {
  try {
    const params = {
      TopicArn: topic_arn,
      Protocol: "https",
      Endpoint: endpoint,
      Attributes: {
        FilterPolicy: JSON.stringify({ customer_id: [customer_id] }),
      },
      ReturnSubscriptionArn: true,
    };
    const data = await sns.subscribe(params).promise();
    if (data.ResponseMetadata) {
      return true;
    }
    throw "Unable to subscribe";
  } catch (error) {
    throw generateErrorMsg(
      error,
      "subscribeToTopicError",
      "sns subscribe error"
    );
  }
}
