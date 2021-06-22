var AWS = require('aws-sdk');

var options = {
    region: process.env.REGION,
};
var documentClient = new AWS.DynamoDB.DocumentClient(options);


// var Dynamo = {

/* fetch all items from table */
async function getAllItems(TableName) {
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
}

/* fetch api key for active customer */
async function fetchApiKey(custResults) {
    var apigateway = new AWS.APIGateway();
    return new Promise((resolve, reject) => {
        var CustomerData = [];
        var params = {
            includeValues: true
        };
        apigateway.getApiKeys(params, function (err, data) {
            if (err) {
                console.log("API Gateway Key Error : ", err, err.stack); // an error occurred
                custResults.forEach((custItem) => {
                    custItem['Created'] = "NA"
                    custItem['Updated'] = "NA"
                    CustomerData.push(custItem);
                });
                let response = {
                    "data": CustomerData
                }
                resolve(response);
            }
            else {
                // console.log(data);
                data.items.forEach((apiKeyObject) => {
                    custResults.forEach((custItem) => {
                        if (apiKeyObject['name'] == custItem['CustomerID']) {
                            custItem['Created'] = apiKeyObject['createdDate']
                            custItem['Updated'] = apiKeyObject['lastUpdatedDate']
                            CustomerData.push(custItem);
                        }
                        else if (!custItem['Created']) {
                            custItem['Created'] = "NA"
                            custItem['Updated'] = "NA"
                            CustomerData.push(custItem);
                        }
                    });
                });
                let response = {
                    "data": CustomerData
                }
                resolve(response);
            }
        });
    })
}


/* search for an item by key value */
async function searchTable(TableName, keyName, keyValue) {
    var results = await getAllItems(TableName);
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
}
/* search all items */
async function fetchAllCustomers(TableName) {
    var results = await getAllItems(TableName);
    if (!results.error) {
        return results;
    } else {
        return results
    }
}


// }

const promisify = (fetchAll) =>
    new Promise((resolve, reject) => {
        fetchAll((error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });

const getCustomer = (params) =>
    // console.log(params);
    promisify((callback) =>
        documentClient.scan(params,
            callback,
        ),
    ).then(async (result) => {
        let data = result.Items ? result : result;
        console.log(data)
        // if (result.LastEvaluatedKey) {
        //     params.ExclusiveStartKey = result.LastEvaluatedKey;
        //     data = data.concat(await getCustomer(params));
        // }
        let dataResp = {
            "data": data
        }
        return dataResp;
    });
module.exports = {
    fetchAllCustomers,
    searchTable,
    fetchApiKey,
    getCustomer
};