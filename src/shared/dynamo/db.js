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

/* fetch record using index */
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
        dynamoSvc.describeTable(params, function (e, data) {
            if (e) {
                // reject({ "error": err });
                console.error("getAllItemsScanCount Error: ", e);
                throw handleError(1004, e, get(e, 'details[0].message', null));
            } else {
                resolve(parseInt(data['Table']['ItemCount']));
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
    } catch (e) {
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
        return await documentClient.put(params).promise()
    } catch (e) {
        console.error("itemInsert Error: ", e);
        throw handleError(1007, e, get(e, 'details[0].message', null));
    }
}

/* create apikey and associate to usageplan */
async function apiKeyCreate(apiParams, usagePlanName) {
    let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    try {
        let result = await apigateway.createApiKey(apiParams).promise();

        const params = {
            keyId: result.id,
            keyType: 'API_KEY',
            usagePlanId: usagePlanName
        };
        await apigateway.createUsagePlanKey(params).promise();
        return result

    } catch (e) {
        console.error("apigateway Error: ", e);
        throw handleError(1006, e, get(e, 'details[0].message', null));
    }

}

/* retrieve item from table */
async function getItem(TableName, hashKey) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: TableName,
        Key: hashKey
    };
    try {
        return await documentClient.get(params).promise();
    } catch (e) {
        console.error("getItem Error: ", e);
        throw handleError(1003, e, get(e, 'details[0].message', null));
    }
}

/* retrieve item from table using filter */
async function getItemQueryFilter(TableName, keyCondition, filterExpression, expressionAttribute) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: TableName,
        KeyConditionExpression: keyCondition,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttribute
    };
    try {
        return await documentClient.query(params).promise();
    } catch (e) {
        console.error("getItem Error: ", e);
        throw handleError(1003, e, get(e, 'details[0].message', null));
    }
}
/* retrieve item from table */
async function getItemQuery(TableName, keyCondition, expressionAttribute) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: TableName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionAttribute
    };
    try {
        return await documentClient.query(params).promise();
    } catch (e) {
        console.error("getItem Error: ", e);
        throw handleError(1003, e, get(e, 'details[0].message', null));
    }
}

/* update record */
async function updateItems(tableName, hashKey, updateExpression, attributesValues) {
    let documentClient = new AWS.DynamoDB.DocumentClient({ region: process.env.DEFAULT_AWS });
    const params = {
        TableName: tableName,
        Key: hashKey,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: attributesValues
    }
    try {
        return await documentClient.update(params).promise();
    } catch (e) {
        console.error("updateItems Error: ", e);
        throw handleError(1008, e, get(e, 'details[0].message', null));
    }
}

/* get apikey from apigateway and delete it */
async function deleteApiKey(apiKeyName) {
    let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    let apiKeyResult
    const params = {
        nameQuery: apiKeyName,
        includeValues: true
    };
    try {
        apiKeyResult = await apigateway.getApiKeys(params).promise();
    } catch (e) {
        console.error("apigateway Error: ", e);
    }
    try {
        if ((apiKeyResult.items).length) {
            const params = {
                apiKey: apiKeyResult.items[0].id
            }
            await apigateway.deleteApiKey(params).promise();
            return apiKeyResult
        } else {
            console.error("apigateway Error: ", handleError(1009))
        }
    } catch (e) {
        console.error("apigateway Error: ", e);
    }
}

/* get apikey from apigateway and diassociate from usageplan */
async function getapikey(apiKeyName, usageId) {
    let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    let apiKeyResult
    const params = {
        nameQuery: apiKeyName,
        includeValues: true
    };
    try {
        apiKeyResult = await apigateway.getApiKeys(params).promise();
    } catch (e) {
        console.error("apigateway Error: ", e);
    }
    try {
        if ((apiKeyResult.items).length) {
            const params = {
                keyId: apiKeyResult.items[0].id,
                usagePlanId: usageId
            };
            await apigateway.deleteUsagePlanKey(params).promise();
            return apiKeyResult
        } else {
            console.error("apigateway Error: ", handleError(1009))
        }
    } catch (e) {
        console.error("apigateway Error: ", e);
    }
}

/* get apikey from apigateway and check in usageplan */
async function checkApiKeyUsagePlan(keyName, usageId) {
    let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
    let keyResult
    const params = {
        nameQuery: keyName,
        includeValues: true
    };
    try {
        keyResult = await apigateway.getApiKeys(params).promise();
    } catch (e) {
        console.error("apigateway Error: ", e);
        throw handleError(1010, e, get(e, 'details[0].message', null));
    }
    try {
        if ((keyResult.items).length) {
            const params = {
                keyId: keyResult.items[0].id,
                usagePlanId: usageId
            };
            return await apigateway.getUsagePlanKey(params).promise();
        } else {
            console.error("apigateway Error: ", handleError(1009));
        }
    } catch (e) {
        console.error("apigateway Error: ", e);
    }
}


module.exports = {
    fetchAllItems,
    fetchByIndex,
    getAllItemsScanCount,
    getAllItemsQueryCount,
    itemInsert,
    apiKeyCreate,
    getItem,
    updateItems,
    getapikey,
    getItemQuery,
    getItemQueryFilter,
    checkApiKeyUsagePlan,
    deleteApiKey
};