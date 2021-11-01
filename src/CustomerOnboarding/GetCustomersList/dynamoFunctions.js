const AWS = require('aws-sdk');

function noDataHandler(dbItems) {
        dbItems['Created'] = "NA"
        dbItems['Updated'] = "NA"
        dbItems['Age'] = "NA",
        dbItems['ApiKey'] = "NA"
    return dbItems;
}
/* fetch apikey using namequery parameter */
async function fetchNameWiseApiKey(customerObject){
    const moment = require("moment");
    const apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    return new Promise((resolve, reject) => {
        let params = {
            includeValues: true,
            nameQuery: customerObject.CustomerID
        };
        apigateway.getApiKeys(params, function (err, data) {
            if (err) {
                console.error("API Gateway Key Error : ", err); // an error occurred
                resolve(noDataHandler(custResults));
            }
            else {
                if ((data.items).length) {
                    data.items.forEach((apiKeyObject) => {
                            if (apiKeyObject['name'] == customerObject.CustomerID) {
                                customerObject['Created'] = apiKeyObject['createdDate']
                                customerObject['Updated'] = apiKeyObject['lastUpdatedDate']
                                customerObject['ApiKey'] = apiKeyObject['value']
                                duration = moment.duration(moment().diff(apiKeyObject['createdDate']))
                                customerObject['Age'] = parseInt(duration.asDays())
                            }
                            else {
                                customerObject['Created'] = "NA"
                                customerObject['Updated'] = "NA"
                                customerObject['Age'] = "NA"
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