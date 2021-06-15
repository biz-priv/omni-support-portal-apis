const { success, failure } = require('../../../shared/utils/responses');
const { updateSubscriptionValidator } = require('../../../shared/utils/vaildator');

//update subscription
module.exports.handler = async (event) => {

    const body = (!event.body ? null : JSON.parse(event.body));
    //validate customerId
    const { error, value } = await updateSubscriptionValidator.validate(body);
    if (error) {
        return failure(400, "missing required parameters", error);
    } else {
        return success(202);
    }

}