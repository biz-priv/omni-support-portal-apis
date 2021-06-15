const { success, failure } = require('../../../shared/utils/responses');
const { statusValidator } = require('../../../shared/utils/vaildator');

//static response
let response = [{
    "CustomerId": 1,
    "Name": 'demo1',
    "BillToAccNumber": 12,
    "CustomerNumber": 9876543210,
    "DeclaredType": 'test1',
    "Station": 'test1'
},
{
    "CustomerId": 2,
    "Name": 'demo2',
    "BillToAccNumber": 123,
    "CustomerNumber": 9876543211,
    "DeclaredType": 'test2',
    "Station": 'test2'
},
{
    "CustomerId": 3,
    "Name": 'demo3',
    "BillToAccNumber": 1234,
    "CustomerNumber": 9876543212,
    "DeclaredType": 'test3',
    "Station": 'test3'
}]


//get customers list 
module.exports.handler = async (event) => {
    const query = (!event.queryStringParameters ? null : event.queryStringParameters);


    //validate query parameter
    const { error, value } = await statusValidator.validate(query);
    if (error) {
        return failure(400, "missing required parameters", error);
    } else {

        //if status true 
        if (query.status == "true") {
            //foreach loop to add parameters in response
            response.forEach(element => {
                element['ApiKeyCreated'] = 'abc',
                    element['ApiKeyUpdated'] = 'xyz',
                    element['ApiKeyAge'] = 2
            });
        }

        //to add status parameter in response
        response.forEach(resp => {
            resp['status'] = query.status;
        });

        return success(200, response);

    }

}