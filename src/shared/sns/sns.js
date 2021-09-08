const AWS = require('aws-sdk');
const get = require('lodash.get');
const { handleError } = require('../utils/responses');

/* topic UnSubscription */
async function topicUnSubscription(subscriptionArn) {
    const sns = new AWS.SNS({ region: process.env.DEFAULT_AWS });
    let params = {
        SubscriptionArn: subscriptionArn
      };
    try {
         return await sns.unsubscribe(params).promise();
    } catch (e) {
        console.error("unsubscription Error: ", e);
        throw handleError(1015, e, get(e, 'details[0].message', null));
    }
}

module.exports = {
    topicUnSubscription
};