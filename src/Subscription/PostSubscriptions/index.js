const { send_response, handleError } = require("../../shared/utils/responses");
const Joi = require("joi");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const Dynamo = require("../../shared/dynamo/db");
const { createSubscriptionValidator } = require("../../shared/utils/validator");

const TOKEN_VALIDATOR = process.env.TOKEN_VALIDATOR;
const CUSTOMER_PREFERENCE_TABLE = process.env.CUSTOMER_PREFERENCE_TABLE;
const EVENTING_TOPICS_TABLE = process.env.EVENTING_TOPICS_TABLE;

/*=================post subscription==============*/
module.exports.handler = async (event) => {
  const eventBody = !event.body ? null : event.body;
  const value = await createSubscriptionValidator(eventBody);
  try {
    if (value.code) {
      return value; // "missing required parameters"
    } else {
      const ApiKey = event.headers["x-api-key"];
      const customerId = await getCustomerId(ApiKey);
      const customerSub = await getCustomerPreference(
        customerId,
        value.EventType,
        value.Preference
      );

      if (customerSub) {
        return handleError(1014); //'Subscription already exists.'
      } else {
        // preference check
        const snsTopicDetails = await getSnsTopicDetails(
          value.EventType
          // preference
        );
        let subscriptionArn = snsTopicDetails.Event_Payload_Topic_Arn;
        if (value.Preference == "fullPayload") {
          subscriptionArn = snsTopicDetails.Full_Payload_Topic_Arn;
        }

        await createCustomerPreference(customerId, value, subscriptionArn);

        //Create an SNS subscription with filter policy as CustomerID.
        await subscribeToTopic(subscriptionArn, value.Endpoint, customerId);
      }
      return send_response(200, { message: "Subscription successfully added" });
    }
  } catch (error) {
    return handleError(1005, null, error);
  }
};

/**
 * Get the CustomerID based on ApiKey from token validator table
 * @param {*} ApiKey
 * @returns
 */
function getCustomerId(ApiKey) {
  return new Promise(async (resolve, reject) => {
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
        resolve(response.Items[0].CustomerID);
      }
      reject("getCustomerIdError: Customer is not exists");
    } catch (error) {
      reject("getCustomerIdError: Something went wrong");
    }
  });
}

/**
 * Check in event preferences table for existing subscription based on
 * Event_Type and Subscription_Preference
 * @param {*} custId
 * @param {*} snsEventType
 * @param {*} subscriptionPreference
 * @returns
 */
function getCustomerPreference(
  Customer_Id,
  Event_Type,
  Subscription_Preference
) {
  return new Promise(async (resolve, reject) => {
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
        resolve(true);
      }
      resolve(false);
    } catch (error) {
      reject("getCustomerPreferenceError: Something went wrong");
    }
  });
}

/**
 * Get the SNS topic details from event topics table based on Event_Type and Preference
 * @param {*} snsEventType
 * @param {*} preference
 * @returns
 */
function getSnsTopicDetails(eventType, preference = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await Dynamo.getItem(EVENTING_TOPICS_TABLE, {
        Event_Type: eventType,
      });
      resolve({
        Event_Payload_Topic_Arn: response.Item.Event_Payload_Topic_Arn,
        Full_Payload_Topic_Arn: response.Item.Full_Payload_Topic_Arn,
      });
    } catch (error) {
      reject("getSnsTopicDetailsError: Something went wrong");
    }
  });
}

/**
 * create Customer Preference
 * @param {*} custId
 * @param {*} eventBody
 * @param {*} arnResponse
 * @returns
 */
function createCustomerPreference(custId, eventBody, subscriptionArn) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await Dynamo.itemInsert(CUSTOMER_PREFERENCE_TABLE, {
        Event_Type: eventBody.EventType,
        Subscription_Preference: eventBody.Preference,
        Customer_Id: custId,
        Endpoint: eventBody.Endpoint,
        Shared_Secret: eventBody.SharedSecret,
        Subscription_arn: subscriptionArn,
      });
      resolve(true);
    } catch (error) {
      reject("createCustomerPreferenceError: Unable to create customer");
    }
  });
}

/**
 *
 * @param {*} topic_arn
 * @param {*} endpoint
 * @param {*} customer_id
 * @returns
 */
function subscribeToTopic(topic_arn, endpoint, customer_id) {
  return new Promise(async (resolve, reject) => {
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
        resolve(true);
      }
      reject("subscribeToTopicError: Unable to subscribe");
    } catch (error) {
      reject("subscribeToTopicError: sns subscribe error");
    }
  });
}
