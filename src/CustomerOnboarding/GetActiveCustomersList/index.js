const { send_response } = require('../../shared/utils/responses');
const Dynamo = require('../../shared/dynamo/db');
const { handleError } = require('../../shared/utils/responses');

const TOKEN_VALIDATOR_TABLE = process.env.TOKEN_VALIDATOR;

module.exports.handler = async (event) => {
    console.info("Event: ", JSON.stringify(event));
    try {
        const activeRecords = await Dynamo.getAllItemsQuery(TOKEN_VALIDATOR_TABLE, "Active");
        if (activeRecords.Items.length) {
            console.info("Info: ", JSON.stringify({ "Customers": activeRecords.Items }))
            return send_response(200, { "Customers": activeRecords.Items });
        } else {
            return send_response(400, handleError(1009))
        }
    } catch (e) {
        console.error("Error: ", JSON.stringify(e));
        return send_response(e.httpStatus, e);
    }

}
