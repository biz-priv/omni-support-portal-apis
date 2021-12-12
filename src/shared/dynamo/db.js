const AWS = require("aws-sdk");
const get = require("lodash.get");
const { handleError } = require("../utils/responses");

async function dbRead(params) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  let result = await documentClient.scan(params).promise();
  let data = result.Items;
  if (result.LastEvaluatedKey) {
    params.ExclusiveStartKey = result.LastEvaluatedKey;
    data = data.concat(await dbRead(params));
  }
  return data;
}

/* retrieve all items from table */
async function scanTableData(TableName) {
  var params = {
    TableName: TableName
  };
  let data = await dbRead(params);
  return data;
}

/* fetch all items from table with filter*/
async function getAllItemsQueryFilter(
  tableName,
  filterExpression,
  expressionAttributeNames,
  expressionAttributeValues
) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  try {
    return await documentClient.scan(params).promise();
  } catch (e) {
    console.error("getAllItemsQueryFilter Error: ", e);
    throw handleError(1003, e, get(e, "details[0].message", null));
  }
}

/* retrieve all items count from table */
async function getAllItemsQueryCount(tableName, status) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    IndexName: "CustomerStatusIndex",
    KeyConditionExpression: "CustomerStatus = :hkey",
    ExpressionAttributeValues: {
      ":hkey": status,
    },
    Count: "true",
  };
  try {
    const result = await documentClient.query(params).promise();
    return result.Count;
  } catch (e) {
    console.error("getAllItemsQueryCount Error: ", e);
    throw handleError(1003, e, get(e, "details[0].message", null));
  }
}

/* insert record in table */
async function itemInsert(tableName, record) {
  let documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    Item: record,
  };
  try {
    return await documentClient.put(params).promise();
  } catch (e) {
    console.error("itemInsert Error: ", e);
    throw handleError(1007, e, get(e, "details[0].message", null));
  }
}

/* create apikey and associate to usageplan */
async function apiKeyCreate(apiParams, usagePlanName) {
  let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
  try {
    let result = await apigateway.createApiKey(apiParams).promise();

    const params = {
      keyId: result.id,
      keyType: "API_KEY",
      usagePlanId: usagePlanName,
    };
    await apigateway.createUsagePlanKey(params).promise();
    return result;
  } catch (e) {
    console.error("apigateway Error: ", e);
    throw handleError(1006, e, get(e, "details[0].message", null));
  }
}

/* retrieve item from table */
async function getItem(tableName, hashKey) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    Key: hashKey,
  };
  try {
    return await documentClient.get(params).promise();
  } catch (e) {
    console.error("getItem Error: ", e);
    throw handleError(1003, e, get(e, "details[0].message", null));
  }
}

/* retrieve item from table using filter */
async function getItemQueryFilter(
  tableName,
  keyCondition,
  filterExpression,
  expressionAttribute
) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyCondition,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttribute,
  };
  try {
    return await documentClient.query(params).promise();
  } catch (e) {
    console.error("getItem Error: ", e);
    throw handleError(1003, e, get(e, "details[0].message", null));
  }
}
/* retrieve item from table */
async function getItemQuery(tableName, keyCondition, expressionAttribute) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionAttribute,
  };
  try {
    return await documentClient.query(params).promise();
  } catch (e) {
    console.error("getItem Error: ", e);
    throw handleError(1003, e, get(e, "details[0].message", null));
  }
}

/* update record */
async function updateItems(
  tableName,
  hashKey,
  updateExpression,
  attributesValues
) {
  let documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    Key: hashKey,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: attributesValues,
  };
  try {
    return await documentClient.update(params).promise();
  } catch (e) {
    console.error("updateItems Error: ", e);
    throw handleError(1008, e, get(e, "details[0].message", null));
  }
}

/* get apikey from apigateway and delete it */
async function apiKeyDelete(apiKeyName) {
  let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
  let apiKeyResult;
  const params = {
    nameQuery: apiKeyName,
    includeValues: true,
  };
  try {
    apiKeyResult = await apigateway.getApiKeys(params).promise();
  } catch (e) {
    console.error("apigateway Error: ", e);
  }
  try {
    if (apiKeyResult.items.length) {
      const params = {
        apiKey: apiKeyResult.items[0].id,
      };
      await apigateway.deleteApiKey(params).promise();
      return apiKeyResult;
    } else {
      console.error("apigateway Error: ", handleError(1009));
    }
  } catch (e) {
    console.error("apigateway Error: ", e);
  }
}

/* get apikey from apigateway and diassociate from usageplan */
async function fetchApiKeyAndDisassociateUsagePlan(apiKeyName, usageId) {
  let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
  let apiKeyResult;
  const params = {
    nameQuery: apiKeyName,
    includeValues: true,
  };
  try {
    apiKeyResult = await apigateway.getApiKeys(params).promise();
  } catch (e) {
    console.error("apigateway Error: ", e);
  }
  try {
    if (apiKeyResult.items.length) {
      const params = {
        keyId: apiKeyResult.items[0].id,
        usagePlanId: usageId,
      };
      await apigateway.deleteUsagePlanKey(params).promise();
      return apiKeyResult;
    } else {
      console.error("apigateway Error: ", handleError(1009));
    }
  } catch (e) {
    console.error("apigateway Error: ", e);
  }
}

/* get apikey from apigateway and check in usageplan */
async function checkApiKeyUsagePlan(keyName, usageId) {
  let apigateway = new AWS.APIGateway({ region: process.env.DEFAULT_AWS });
  let keyResult;
  const params = {
    nameQuery: keyName,
    includeValues: true,
  };
  try {
    keyResult = await apigateway.getApiKeys(params).promise();
  } catch (e) {
    console.error("apigateway Error: ", e);
    throw handleError(1010, e, get(e, "details[0].message", null));
  }
  try {
    if (keyResult.items.length) {
      const params = {
        keyId: keyResult.items[0].id,
        usagePlanId: usageId,
      };
      return await apigateway.getUsagePlanKey(params).promise();
    } else {
      console.error("apigateway Error: ", handleError(1009));
    }
  } catch (e) {
    console.error("apigateway Error: ", e);
  }
}

/* fetch items using index */
async function queryByIndex(
  tableName,
  indexName,
  keyCondition,
  expressionAttribute
) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  let params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionAttribute,
  };
  try {
    return await documentClient.query(params).promise();
  } catch (e) {
    console.error("fetchByIndex Error: ", e);
    throw handleError(1002, e, get(e, "details[0].message", null));
  }
}

/* get all items from table */
async function getAllItems(tableName) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  let params = {
    TableName: tableName,
  };
  try {
    return await documentClient.scan(params).promise();
  } catch (e) {
    console.error("fetchAllItems Error: ", e);
    throw handleError(1004, e, get(e, "details[0].message", null));
  }
}

/* delete item from table */
async function deleteItem(tableName, key_param) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  let params = {
    TableName: tableName,
    Key: key_param,
  };
  try {
    return await documentClient.delete(params).promise();
  } catch (e) {
    console.error("deleteItem Error: ", e);
    throw handleError(1016, e, get(e, "details[0].message", null));
  }
}

/* fetch items using getbatchitem two table */
async function fetchBatchItems(keyValueArray, tableName) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  let requestItem = {}
  requestItem[tableName] = {
    Keys: keyValueArray
  }
  let params = {
    RequestItems: requestItem
  };
  try {
    return await documentClient.batchGet(params).promise();
  } catch (e) {
    console.error("fetchAllItems Error: ", e);
    throw handleError(1004, e, get(e, "details[0].message", null));
  }
}

/* retrieve all items using index from table */
async function getAllItemsQuery(tableName, status) {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });
  const params = {
    TableName: tableName,
    IndexName: "CustomerStatusIndex",
    KeyConditionExpression: "CustomerStatus = :hkey",
    ExpressionAttributeValues: {
      ":hkey": status,
    },
  };
  try {
    return await documentClient.query(params).promise();
  } catch (e) {
    console.error("getAllItemsQueryCount Error: ", e);
    throw handleError(1003, e, get(e, "details[0].message", null));
  }
}

module.exports = {
  getAllItemsQueryCount,
  itemInsert,
  apiKeyCreate,
  getItem,
  updateItems,
  fetchApiKeyAndDisassociateUsagePlan,
  getItemQuery,
  getItemQueryFilter,
  checkApiKeyUsagePlan,
  apiKeyDelete,
  queryByIndex,
  getAllItems,
  deleteItem,
  getAllItemsQueryFilter,
  fetchBatchItems,
  scanTableData,
  getAllItemsQuery,
};
