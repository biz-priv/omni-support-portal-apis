const { success, failure } = require('../../shared/utils/responses');
const { userActivityIdValidator } = require('../../shared/utils/validator');
//static response
let response = [{
    "CustomerId": 1,
    "Type": "type test1",
    "Timestamp": "2021-06-15 10:10:10+05:30",
    "Description": "desc1"
},
{
    "CustomerId": 2,
    "Type": "test2",
    "Timestamp": "2021-06-15 10:10:10+05:30",
    "Description": "desc2"
},
{
    "CustomerId": 3,
    "Type": "type test3",
    "Timestamp": "2021-06-15 10:10:10+05:30",
    "Description": "desc3"
},
{
    "CustomerId": 4,
    "Type": "test4",
    "Timestamp": "2021-06-15 10:10:10+05:30",
    "Description": "desc4"
}]

//get user activity list 
module.exports.handler = async (event) => {
    console.info("Event\n" + JSON.stringify(event, null, 2));
    //validate pathParameters
    const { error, value } = await userActivityIdValidator.validate(event.pathParameters);
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        console.info("Response\n" + JSON.stringify(response, null, 2));
        return success(200, response);
    }

}