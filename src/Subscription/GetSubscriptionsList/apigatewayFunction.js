const AWS = require('aws-sdk');

function noDataHandler(dbItems) {
        dbItems['ApiKey'] = "NA"
    return dbItems;
}
/* fetch apikey using namequery parameter */
async function fetchNameWiseApiKey(customerObject){
    const apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    return new Promise((resolve, reject) => {
        let params = {
            includeValues: true,
            nameQuery: customerObject.Customer_Id
        };
        apigateway.getApiKeys(params, function (err, data) {
            if (err) {
                console.error("API Gateway Key Error : ", err); // an error occurred
                resolve(noDataHandler(customerObject));
            }
            else {
                if ((data.items).length) {
                    data.items.forEach((apiKeyObject) => {
                            if (apiKeyObject['name'] == customerObject.Customer_Id) {
                                customerObject['ApiKey'] = apiKeyObject['value']
                            }
                            else {
                                customerObject['ApiKey'] = "NA"
                            }
                    });

                } else {
                    resolve(noDataHandler(customerObject));
                }
            }
            resolve(customerObject);
        });
    })
}

/* fetch api key for customer */
async function fetchApiKey(accountInfo) {
    let promise = [];
    (accountInfo).forEach(element => {
        promise.push(fetchNameWiseApiKey(element))
    });

    return await Promise.all(promise);
}

module.exports = {
    fetchApiKey
};