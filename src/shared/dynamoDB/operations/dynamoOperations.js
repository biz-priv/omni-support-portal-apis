var AWS = require('aws-sdk');
var options = {
    region: process.env.REGION,
};
var credentials = new AWS.SharedIniFileCredentials({ profile: process.env.profile });
AWS.config.credentials = credentials;

var documentClient = new AWS.DynamoDB.DocumentClient(options);
var dynamoDB = new AWS.DynamoDB();


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
    async fetchApiKey(tableName, custResults) {
        var results = await this.getAllItems(tableName);
        // console.log(results);
        var data = [];
        if (!results.error) {
            results.data.forEach((item) => {
                custResults.forEach((custItem) => {
                    if (item['CustomerID'] == custItem['CustomerID']) {
                        custItem['ApiKey'] = item['ApiKey']
                        custItem['Name'] = item['Customer_name']
                        data.push(custItem);
                    }
                })
            });
            return data;
        } else {
            return results
        }
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
            return results.data;
        } else {
            return results
        }
    },


};
module.exports = Dynamo;