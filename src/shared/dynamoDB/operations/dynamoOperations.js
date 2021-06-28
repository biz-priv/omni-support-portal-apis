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

/* retrieve all items count from table */
async function getAllItemsScanCount(TableName) {
    var dynamoSvc = new AWS.DynamoDB({ region: process.env.DEFAULT_AWS });
    var params = {
        TableName: TableName,
    };
    return new Promise((resolve, reject) => {
        dynamoSvc.describeTable(params, function (err, data) {
            if (err) {
                let dataResp = {
                    "error": err
                }
                reject(dataResp);
            } else {
                var table = data['Table'];
                let dataResp = {
                    "data": parseInt(table['ItemCount'])
                }
                resolve(dataResp);
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

    var promise = documentClient.query(params).promise();
    let result = await promise;
    let data = result.Count;
    let dataResp = {
        "data": data
    }
    return dataResp;
}

module.exports = {
    fetchAllItems,
    fetchByIndex,
    getAllItemsScanCount,
    getAllItemsQueryCount
};