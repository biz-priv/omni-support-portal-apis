var AWS = require('aws-sdk');

var options = {
    region: process.env.REGION,
};
var documentClient = new AWS.DynamoDB.DocumentClient(options);


/* fetch all items from table */
async function getAllItems(TableName, status,  limit, startkey) {
    var params = {
        TableName: TableName,
        Limit: limit
    };
    if (startkey) {
       params['ExclusiveStartKey'] = { 'EventStatus': status, 'CustomerID': startkey }
    }
    async function dbRead(params) {
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
    let data = await dbRead(params);
    return data;
}

async function getConditionItems(TableName, status, limit, startkey) {

    var params = {
        TableName : TableName,
        Limit: limit,
        KeyConditions: {
             'EventStatus':{
                 ComparisonOperator: "EQ",
                 AttributeValueList: [status]
             }
         }
      };
    if (startkey) {
        params['ExclusiveStartKey'] = { 'EventStatus': status, 'CustomerID': startkey }
    }
    async function dbRead(params) {
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
    let data = await dbRead(params);
    return data;

}

/* search for an item by key value */
async function searchTable(TableName, status, limit, startkey) {
    var results = await getConditionItems(TableName, status, limit, startkey);
    if (!results.error) {
        return results;
    } else {
        return results
    }
}


/* search all items */
async function fetchAllCustomers(TableName, status, limit, startkey) {
    var results = await getAllItems(TableName, status, limit, startkey);
    if (!results.error) {
        return results;
    } else {
        return results
    }
}


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
        let dataResp = {
            "data": data
        }
        return dataResp;
    });
module.exports = {
    fetchAllCustomers,
    searchTable,
    getCustomer
};