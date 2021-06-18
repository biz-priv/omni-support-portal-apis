var AWS = require('aws-sdk');


var options = {
    region: process.env.REGION,
};
var credentials = new AWS.SharedIniFileCredentials({ profile: process.env.profile });
AWS.config.credentials = credentials;

var documentClient = new AWS.DynamoDB.DocumentClient(options);
var apigateway = new AWS.APIGateway();

var Dynamo = {

    /* fetch all items from table */
    async getAllItems(TableName) {
        var params = {
            TableName: TableName
        };
        async function dbRead(params) {
            try {
                let promise = documentClient.scan(params).promise();
                let result = await promise;
                let data = result.Items;
                if (result.LastEvaluatedKey) {
                    params.ExclusiveStartKey = result.LastEvaluatedKey;
                    data = data.concat(await dbRead(params));
                }
                let dataResp = {
                    "data": data
                }
                return dataResp;
            } catch (err) {
                let errResp = {
                    "error": err
                }
                return errResp
            }
        }
        let data = await dbRead(params);
        return data;
    },

    /* fetch api key for active customer */
    async fetchApiKey(custResults) {
        return new Promise((resolve,reject) => {
            var CustomerData = [];
            var params = {
                includeValues: true
            };
            apigateway.getApiKeys(params, function(err, data) {
                if (err){
                    console.log("API Gateway Key Error : ",err, err.stack); // an error occurred
                    custResults.forEach((custItem) => {
                        custItem['Created'] = "NA"
                        custItem['Updated'] = "NA"
                        CustomerData.push(custItem);    
                    });
                    let response = {
                        "data" : CustomerData
                    }
                    resolve(response);
                }
                else{
                    // console.log(data);
                    data.items.forEach((apiKeyObject) => {
                        custResults.forEach((custItem) => {
                            if (apiKeyObject['name'] == custItem['CustomerID']) {
                                custItem['Created'] = apiKeyObject['createdDate']
                                custItem['Updated'] = apiKeyObject['lastUpdatedDate']
                                CustomerData.push(custItem);
                            }
                            else if(!custItem['Created']){
                                custItem['Created'] = "NA"
                                custItem['Updated'] = "NA"
                                CustomerData.push(custItem);
                            }
                        });
                    });
                    let response = {
                        "data" : CustomerData
                    }
                    resolve(response);
                }
            });
        })
    },


    /* search for an item by key value */
    async searchTable(TableName, keyName, keyValue) {
        var results = await this.getAllItems(TableName);
        var data = [];
        if (!results.error) {
            results.data.forEach((item) => {
                if (item[keyName] == keyValue) {
                    data.push(item);
                }
            });
            return data;
        } else {
            return results
        }
    },
    /* search all items */
    async fetchAllCustomers(TableName) {
        var results = await this.getAllItems(TableName);
        if (!results.error) {
            return results;
        } else {
            return results
        }
    },


};
module.exports = Dynamo;