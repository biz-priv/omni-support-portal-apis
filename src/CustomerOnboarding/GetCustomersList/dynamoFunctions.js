var AWS = require('aws-sdk');

function noDataHandler(dbItems){
    CustomerTempData = [];
    dbItems.forEach((custItem) => {
        custItem['Created'] = "NA"
        custItem['Updated'] = "NA"
        custItem['Age'] = "NA"
        CustomerTempData.push(custItem);
    });
    return CustomerTempData;
}

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
                console.error("API Gateway Key Error : ", err); // an error occurred
                CustomerData = noDataHandler(custResults);
            }
            else 
            {
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
                    CustomerData = noDataHandler(custResults);
                }
            }
            let resp = {
                "Items": CustomerData
            }
            if (accountInfo.data.LastEvaluatedKey) {
                resp["LastEvaluatedKey"] = accountInfo.data.LastEvaluatedKey
            }
            resolve({
                "data": resp
            });
        });
    })
}

module.exports = {
    fetchApiKey
};