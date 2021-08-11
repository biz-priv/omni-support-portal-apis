const { send_response, handleError } = require("../../shared/utils/responses");
const Joi = require("joi");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const Dynamo = require("../../shared/dynamo/db");

const TOKEN_VALIDATOR = process.env.TOKEN_VALIDATOR;
const CUSTOMER_PREFERENCE_TABLE = process.env.CUSTOMER_PREFERENCE_TABLE;
const EVENTING_TOPICS_TABLE = process.env.EVENTING_TOPICS_TABLE;

/*=================create subscriptions parameters validate==============*/
var createSubscriptionValidator = Joi.object().keys({
  EventType: Joi.string().required(),
  Preference: Joi.string().required(),
  Endpoint: Joi.string().pattern(
    new RegExp(
      "^(https?:\\/\\/)?" +
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" +
        "((\\d{1,3}\\.){3}\\d{1,3}))" +
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
        "(\\?[;&a-z\\d%_.~+=-]*)?" +
        "(\\#[-a-z\\d_]*)?$",
      "i"
    )
  ),
  SharedSecret: Joi.string().required(),
});

//post subscription
module.exports.handler = async (event) => {
  console.info("Event\n" + JSON.stringify(event, null, 2));
  const eventBody = !event.body ? null : event.body;

  //validate subscription parameters
  const { error, value } = createSubscriptionValidator.validate(eventBody);
  console.log("validationvalue", value);

  if (error) {
    console.error("Error\n" + JSON.stringify(error, null, 2));
    return handleError(400, "missing required parameters", error);
  } else {
    const ApiKey = "9jM8ATQQYB2XmJsETRAq77EuqcY522Xu3pszdmcY";
    const customerId = await getCustomerId(ApiKey);
    console.log("customerId", customerId);
    const customerSub = await getCustomerPreference(
      customerId,
      value.EventType,
      value.Preference
    );
    console.log("customerSub", customerSub);

    if (customerSub) {
      //error
      return handleError(1014); //'Subscription already exists.'
    } else {
      // preference check
      const snsTopicDetails = await getSnsTopicDetails(
        value.EventType
        // preference
      );
      console.log("snsTopicDetails", snsTopicDetails);

      //insert
      let subscriptionArn = snsTopicDetails.Event_Payload_Topic_Arn;
      if (value.Preference == "fullPayload") {
        subscriptionArn = snsTopicDetails.Full_Payload_Topic_Arn;
      }

      const createCustomerSub = await createCustomerPreference(
        customerId,
        value,
        subscriptionArn
      );
      console.log("createCustomerSub", createCustomerSub);

      //Create an SNS subscription with filter policy as CustomerID.
      const topicSubcription = await subscribeToTopic(
        subscriptionArn,
        value.Endpoint,
        customerId
      );
      console.log("topicSubcription", topicSubcription);
    }

    return send_response(200, { message: "Subscription successfully added" });
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
      } else {
        reject();
      }
    } catch (error) {
      console.error(error);
      reject(error);
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
      console.log("getCustomerPreference", response);
      if (
        response.Items &&
        response.Items.length > 0 &&
        response.Items[0].Subscription_Preference
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error(error);
      reject(error);
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
      //   console.log("getSnsTopicDetails", response);
      resolve({
        Event_Payload_Topic_Arn: response.Item.Event_Payload_Topic_Arn,
        Full_Payload_Topic_Arn: response.Item.Full_Payload_Topic_Arn,
      });
    } catch (error) {
      console.error(error);
      reject(error);
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
      console.log("createCustomerPreference", response, custId);
      if (response.Item && response.Item) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error(error);
      reject(error);
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
      //SNS service
      await sns.subscribe(params).promise();
      //   const data = await sns.subscribe(params).promise();
      //   console.log("subscribeToTopic", data);
      resolve(true);
    } catch (error) {
      console.log("SNSPublishError: ", error);
      reject(error);
    }
  });
}
