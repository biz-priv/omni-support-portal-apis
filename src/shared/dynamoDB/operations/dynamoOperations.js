var AWS = require('aws-sdk');

var documentClient = new AWS.DynamoDB.DocumentClient();


/* fetch all items from table */
async function fetchAllItems(TableName, limit, startkey) {
    var params = {
        TableName: TableName,
        Limit: limit
    };
    if (startkey) {
        params['ExclusiveStartKey'] = startkey
    }
    try {
        let promise = documentClient.scan(params).promise();
        let result = await promise;
        let dataResp = {
            "data": result
        }
        return dataResp;
    } catch (err) {
        let errResp = {
            "error": err
        }
        return errResp
    }
}

async function fetchByIndex(TableName, status, limit, startkey) {
    var params = {
        TableName: TableName,
        Limit: limit,
        IndexName: 'EventStatusIndex',
        KeyConditionExpression: 'EventStatus = :hkey',
        ExpressionAttributeValues: {
            ':hkey': status
        }
    };

    if (startkey) {
        params['ExclusiveStartKey'] = startkey
    }
    try {
        let promise = documentClient.query(params).promise();
        let result = await promise;
        let dataResp = {
            "data": result
        }
        return dataResp;
    } catch (err) {
        let errResp = {
            "error": err
        }
        return errResp
    }

}

async function dbRead(params, flag) {
    try {
        if (flag == 0) {
            var promise = documentClient.scan(params).promise();
        }
        if (flag == 1) {
            var promise = documentClient.query(params).promise();
        }

        let result = await promise;
        let data = result.Items;
        if (result.LastEvaluatedKey) {
            params.ExclusiveStartKey = result.LastEvaluatedKey;
            data = data.concat(await dbRead(params, flag));
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
/* retrieve all items count from table */
async function getAllItemsScanCount(TableName) {
    var params = {
        TableName: TableName
    };
    let data = await dbRead(params, 0);
    return data;
}

/* retrieve all items count from table */
async function getAllItemsQueryCount(TableName, status) {
    var params = {
        TableName: TableName,
        IndexName: 'EventStatusIndex',
        KeyConditionExpression: 'EventStatus = :hkey',
        ExpressionAttributeValues: {
            ':hkey': status
        }
    };
    let data = await dbRead(params, 1);
    return data;
}

module.exports = {
    fetchAllItems,
    fetchByIndex,
    getAllItemsScanCount,
    getAllItemsQueryCount
};