const { success, failure } = require('../../../shared/utils/responses');

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
module.exports.handler = (event) => {
    //send response
    return success(200, response);
}