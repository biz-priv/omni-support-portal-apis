var AWS = require('aws-sdk');

var options = {
    region: process.env.REGION,
};
var documentClient = new AWS.DynamoDB.DocumentClient(options);


async function searchBlogByTitle(params, itemsPerPage, lastEvaluatedKey) {
    // const FIXED_ID_FOR_SEARCH_GSI = "1233421345223";
    // console.log(itemsPerPage)
    // let params = await documentClient.scan({TableName: 'omni-dw-account-info-dev', Limit: itemsPerPage}).promise();
    // console.log(params)
    // params = query
    params['TableName'] = 'omni-dw-account-info-dev';
    params['Limit'] = parseInt(itemsPerPage);
    if (lastEvaluatedKey) {
      let keyValues = lastEvaluatedKey;
    //   console.log(keyValues)
      // set ExclusiveStartKey only when server get complete lastEvaluatedKey as sent by it
      if (keyValues.length === 1) {
        //   console.log(keyValues.length)
        params['ExclusiveStartKey'] = {
          CustomerID: keyValues
        };
        // console.log(params)
      }
    }
    // console.log(params)
    return performPaginatedOperation(params, "scan", ["CustomerID"]);
  
  }

// This is a generic method that can perform pagination on any table and for both scan as well as query operation.  
function performPaginatedOperation(params,
    operationName, tableLastEvaluatedKeyFieldNames) {
  
    return new Promise((resolve, reject) => {
      const dataWithKey = {
        lastEvaluatedKey: undefined,
        result: []
      };
      console.log("params=====> ", params);
      // adding 1 extra items due to a corner case bug in DynamoDB, find details below.    
      const originalItemPerPageCount = params.Limit;
      params['Limit'] = params.Limit + 1;
      let remainingItemsCount = 0;
      // DatabaseProvider.getDocumentClient() should give us the dynamoDB DocumentClient object
      // How to get DocumentClient: http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.03.html#GettingStarted.NodeJs.03.01
      documentClient.scan(params, onScan);
  
  
      function onScan(err, data) {
        if (err) {
          return reject(err);
        }
        // console.log(data);
        dataWithKey.result = dataWithKey.result.concat(data.Items);
        remainingItemsCount = (originalItemPerPageCount + 1) - dataWithKey.result.length;
        if (remainingItemsCount > 0) {
          if (typeof data.LastEvaluatedKey === "undefined") {
            // pagination done, this is the last page as LastEvaluatedKey is undefined
            return resolve(dataWithKey);
          } else {
            // Continuing pagination for more data
            // as we didnot get our desired itemsPerPage. Remember ScannedCount and Count fields!!  
            params['ExclusiveStartKey'] = data.LastEvaluatedKey;
            params['Limit'] = remainingItemsCount;
            documentClient.scan(params, onScan);
          }
        } else {
          dataWithKey.result = dataWithKey.result.slice(0, originalItemPerPageCount);
          // pagination done, but this is not the last page. making lastEvaluatedKey to
          // send to browser
          dataWithKey.lastEvaluatedKey = prepareLastEvaluatedKeyString(
            dataWithKey.result[originalItemPerPageCount - 1], tableLastEvaluatedKeyFieldNames);
          return resolve(dataWithKey);
        }
      }
    });
  }
  
  // Preparing lastEvaluatedKey as comma seperated values of lastEvaluatedKey fields
  function prepareLastEvaluatedKeyString(dataObj, tableLastEvaluatedKeyFieldNames) {
    let key = "";
    tableLastEvaluatedKeyFieldNames.forEach((field) => {
      key += dataObj[field] + ",";
    });
    if (key !== "") {
      key = key.substr(0, key.length - 1);
    }
    // console.log("key=======> ", key)
    return key;
  }

module.exports = {
    searchBlogByTitle
}