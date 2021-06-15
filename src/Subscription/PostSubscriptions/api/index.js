const { success, failure } = require('../../../shared/utils/responses');
const { createSubscriptionValidator } = require('../../../shared/utils/vaildator');

//post subscription
module.exports.handler = async (event) => {

    const body = (!event.body ? null : JSON.parse(event.body));
    //validate subscription parameters
    const {error, value} = await createSubscriptionValidator.validate(body);
     if (error) {
         return failure(400, "missing required parameters", error);
     } else {
         return success(202);
     }

}