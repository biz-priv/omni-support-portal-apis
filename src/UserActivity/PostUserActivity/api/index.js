const { success, failure } = require('../../../shared/utils/responses');


//post user activity
module.exports.handler = async (event) => {

    const body = (!event.body ? null : JSON.parse(event.body));
    //send response
    return success(202);

}