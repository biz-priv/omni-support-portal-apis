const AWS = require('aws-sdk');
const get = require('lodash.get');
const { handleError } = require('../utils/responses');

/* fetch all items from table */
async function fetchAllItems(TableName, limit, startkey) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    let params = {
        TableName: TableName,
        Limit: limit
    };
    if (startkey) {
        params['ExclusiveStartKey'] = startkey;
    }
    try {
        return await documentClient.scan(params).promise();
    } catch (e) {
        console.error("fetchAllItems Error: ", e);
        throw handleError(1004, e, get(e, 'details[0].message', null));
    }
}

async function fetchByIndex(TableName, status, limit, startkey) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    let params = {
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
        return await documentClient.query(params).promise();
    } catch (e) {
        console.error("fetchByIndex Error: ", e);
        throw handleError(1002, e, get(e, 'details[0].message', null));
    }

}

/* retrieve all items count from table */
async function getAllItemsScanCount(TableName) {
    const dynamoSvc = new AWS.DynamoDB({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: TableName,
    };
    return new Promise((resolve, reject) => {
        dynamoSvc.describeTable(params, function (err, data) {
            if (err) {
                // reject({ "error": err });
                console.error("getAllItemsScanCount Error: ", e);
                throw handleError(1004, e, get(e, 'details[0].message', null));
            } else {
                let table = data['Table'];
                resolve(parseInt(table['ItemCount']));
            }
        });
    });
}

/* retrieve all items count from table */
async function getAllItemsQueryCount(TableName, status) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: TableName,
        IndexName: 'CustomerStatusIndex',
        KeyConditionExpression: 'CustomerStatus = :hkey',
        ExpressionAttributeValues: {
            ':hkey': status
        },
        Count: 'true'
    };
    try {
        const result = await documentClient.query(params).promise();
        return result.Count;
    } catch(e){
        console.error("getAllItemsQueryCount Error: ", e);
        throw handleError(1003, e, get(e, 'details[0].message', null));
    }
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