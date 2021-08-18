const { send_response } = require('../../shared/utils/responses');
const validate = require('./validate');
const Dynamo = require('../../shared/dynamo/db');
const { get } = require('lodash');
const USERACTIVITY = process.env.USER_ACTIVITY;
const moment = require("moment");

//post user activity
module.exports.handler = async (event) => {
    console.info("Event: ", JSON.stringify(event));
    event = await validate(event);
    if (!event.code) {
        try {
            await Dynamo.itemInsert(USERACTIVITY, { "UserId": get(event, "pathParameters.id"), "Activity": get(event, "body.Activity"), "Timestamp": moment().format('MMMM Do YYYY, h:mm:ss a'), "Description": get(event, "body.Description") });
            return await send_response(200);
        } catch (e) {
            console.error("Error: ", JSON.stringify(e));
            return await send_response(e.httpStatus, e);
        }
    } else {
        console.error("Error: ", JSON.stringify(event));
        return await send_response(event.httpStatus, event);
    }

}