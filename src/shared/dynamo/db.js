var AWS = require('aws-sdk');

/* fetch all items from table */
async function fetchAllItems(TableName, limit, startkey) {
    var documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    var params = {
        TableName: TableName,
        Limit: limit
    };
    if (startkey) {
        params['ExclusiveStartKey'] = startkey
    }
    try {
        let result = await documentClient.scan(params).promise();
        return {
            "data": result
        };
    } catch (err) {
        return {
            "error": err
        }
    }
}

async function fetchByIndex(TableName, status, limit, startkey) {
    var documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    var params = {
        TableName: TableName,
        Limit: limit,
        IndexName: 'CustomerStatusIndex',
        KeyConditionExpression: 'CustomerStatus = :hkey',
        ExpressionAttributeValues: {
            ':hkey': status
        }
    };

    if (startkey) {
        params['ExclusiveStartKey'] = startkey
    }
    try {
        let result = await documentClient.query(params).promise();
        return {
            "data": result
        };
    } catch (err) {
        return {
            "error": err
        }
    }

}

/* retrieve all items count from table */
async function getAllItemsScanCount(TableName) {
    var dynamoSvc = new AWS.DynamoDB({ region: process.env.DEFAULT_AWS });
    var params = {
        TableName: TableName,
    };
    return new Promise((resolve, reject) => {
        dynamoSvc.describeTable(params, function (err, data) {
            if (err) {
                reject({ "error": err });
            } else {
                var table = data['Table'];
                resolve({ "data": parseInt(table['ItemCount']) });
            }
        });
    });
}

/* retrieve all items count from table */
async function getAllItemsQueryCount(TableName, status) {
    var documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    var params = {
        TableName: TableName,
        IndexName: 'CustomerStatusIndex',
        KeyConditionExpression: 'CustomerStatus = :hkey',
        ExpressionAttributeValues: {
            ':hkey': status
        },
        Count: 'true'
    };

    let result = await documentClient.query(params).promise();
    return { "data": result.Count };
}

/* insert record in table */
async function itemInsert(tableName, record) {
    var documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    var params = {
        TableName: tableName,
        Item: record
    }
    try {
        let result = documentClient.put(params).promise()
        return { "data": result }
    } catch (err) {
        return { "error": err }
    }
}

async function apiKeyCreate(apiParams, usagePlanName) {
    let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    try {
        let result = await apigateway.createApiKey(apiParams).promise();
        
        let params = {
            keyId: result.id,
            keyType: 'API_KEY',
            usagePlanId: usagePlanName
        };

        let usagePlanResult = await apigateway.createUsagePlanKey(params).promise();
        return { "data": result }
   
    } catch (err) {
        return { "error": err }
    }

}


module.exports = {
    fetchAllItems,
    fetchByIndex,
    getAllItemsScanCount,
    getAllItemsQueryCount,
    itemInsert,
    apiKeyCreate
};