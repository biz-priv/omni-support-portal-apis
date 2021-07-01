const AWS = require('aws-sdk');

/* fetch all items from table */
async function fetchAllItems(TableName, limit, startkey) {
    let documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: TableName,
        Limit: limit
    };
    if (startkey) {
        params['ExclusiveStartKey'] = startkey
    }
    try {
        return {
            "data": await documentClient.scan(params).promise()
        };
    } catch (err) {
        return {
            "error": err
        }
    }
}

async function fetchByIndex(TableName, status, limit, startkey) {
    let documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
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
        return {
            "data": await documentClient.query(params).promise()
        };
    } catch (err) {
        return {
            "error": err
        }
    }

}

/* retrieve all items count from table */
async function getAllItemsScanCount(TableName) {
    let dynamoSvc = new AWS.DynamoDB({ region: process.env.DEFAULT_AWS });
    const params = {
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
    let documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
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
    let documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: tableName,
        Item: record
    }
    try {
        return { "data": await documentClient.put(params).promise() }
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
        await apigateway.createUsagePlanKey(params).promise();
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