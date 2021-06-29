var AWS = require('aws-sdk');

/* fetch api key for active customer */
async function fetchApiKey(accountInfo) {
    var moment = require("moment");
    var apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    let custResults = accountInfo.data.Items;
    return new Promise((resolve, reject) => {
        var CustomerData = [];
        var params = {
            includeValues: true
        };
        apigateway.getApiKeys(params, function (err, data) {
            if (err) {
                console.error("API Gateway Key Error : ", err, err.stack); // an error occurred
                custResults.forEach((custItem) => {
                    custItem['Created'] = "NA"
                    custItem['Updated'] = "NA"
                    custItem['Age'] = "NA"
                    CustomerData.push(custItem);
                });
                let resp = {
                    "Items": CustomerData
                }
                if (accountInfo.data.LastEvaluatedKey) {
                    resp["LastEvaluatedKey"] = accountInfo.data.LastEvaluatedKey
                }
                let response = {
                    "data": resp
                }

                resolve(response);
            }
            else {
                if ((data.items).length) {
                    data.items.forEach((apiKeyObject) => {
                        custResults.forEach((custItem) => {
                            if (apiKeyObject['name'] == custItem['CustomerID']) {
                                custItem['Created'] = apiKeyObject['createdDate']
                                custItem['Updated'] = apiKeyObject['lastUpdatedDate']
                                duration = moment.duration(moment().diff(apiKeyObject['createdDate']))
                                custItem['Age'] = parseInt(duration.asDays())
                                CustomerData.push(custItem);
                            }
                            else if (!custItem['Created']) {
                                custItem['Created'] = "NA"
                                custItem['Updated'] = "NA"
                                custItem['Age'] = "NA"
                                CustomerData.push(custItem);
                            }
                        });
                    });
                } else {
                    custResults.forEach((custItem) => {
                        custItem['Created'] = "NA"
                        custItem['Updated'] = "NA"
                        custItem['Age'] = "NA"
                        CustomerData.push(custItem);
                    });
                }

                let resp = {
                    "Items": CustomerData
                }
                if (accountInfo.data.LastEvaluatedKey) {
                    resp["LastEvaluatedKey"] = accountInfo.data.LastEvaluatedKey
                }
                let response = {
                    "data": resp
                }
                resolve(response);
            }
        });
    })
}

module.exports = {
    fetchApiKey
};