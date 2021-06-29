'use strict';

const mod = require('./../src/CustomerOnboarding/GetCustomersList/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');

describe('module test', () => {

  afterEach(() => {
    AWSMock.restore();
  });

  it('get all customers record with default page, limit and startkey', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: [{ CustomerID: "1234", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "12345", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "123456", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Inactive" }, { CustomerID: "1234567", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Inactive" }] });
    })

    AWSMock.mock('DynamoDB', 'describeTable', (params, callback) => {
      callback(null, { Table: { ItemCount: '4' } });
    })

    let event = {
      "queryStringParameters": { status: 'false' },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    expect(JSON.parse(actual.body)).toStrictEqual({ "Customers": [{ "CustomerID": "1234", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active" }, { "CustomerID": "12345", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active" }, { "CustomerID": "123456", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Inactive" }, { "CustomerID": "1234567", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Inactive" }], "Page": { "Size": 4, "TotalElement": 4, "Number": 1 }, "_links": { "self": { "href": "localhost:3000/devint/customers?status=false&page=1&size=10&startkey=0" } } });

  });

  it('get all customers record with page, size and startkey', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: [{ CustomerID: "1234", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "12345", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "123456", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Inactive" }, { CustomerID: "1234567", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Inactive" }], LastEvaluatedKey: { 'CustomerID': '123456' } });
    })

    AWSMock.mock('DynamoDB', 'describeTable', (params, callback) => {
      callback(null, { Table: { ItemCount: '4' } });
    })

    let event = {
      "queryStringParameters": { status: 'false', page: 1, size: 3, startkey: '123456' },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    expect(JSON.parse(actual.body)).toStrictEqual({ "Customers": [{ "CustomerID": "1234", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active" }, { "CustomerID": "12345", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active" }, { "CustomerID": "123456", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Inactive" }, { "CustomerID": "1234567", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Inactive" }], "Page": { "Size": 4, "TotalElement": 4, "TotalPages": 1, "Number": 1, "StartKey": "123456" }, "_links": { "self": { "href": "localhost:3000/devint/customers?status=false&page=1&size=3&startkey=123456", "nextHref": "localhost:3000/devint/customers?status=false&page=2&size=3&startkey=123456" } } });
  });

  it('get active customers record with api keys (match key in apigateway) with startkey', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, {
        Items: [{ CustomerID: "1234", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "12345", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "123456", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }], LastEvaluatedKey: { 'CustomerID': '123456' },
        Count: 10
      });
    })

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, { items: [{ id: 'sdfkj1', value: "1234", name: "1234", customerId: "1234", description: "test", enabled: "true", createdDate: "2021-06-18T06:54:54.000Z", lastUpdatedDate: "2021-06-26T06:54:54.000Z", stageKeys: "test", tags: "tag" }] });
    });

    let event = {
      "queryStringParameters": { status: 'true', page: 1, size: 3, startkey: '123456' },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    let age = (JSON.parse(actual.body)).Customers[0].Age
    expect(JSON.parse(actual.body)).toStrictEqual({ "Customers": [{ "CustomerID": "1234", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "2021-06-18T06:54:54.000Z", "Updated": "2021-06-26T06:54:54.000Z", "Age": age }, { "CustomerID": "12345", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }, { "CustomerID": "123456", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }], "Page": { "Size": 3, "TotalElement": 10, "TotalPages": 3, "CustomerStatus": true, "StartKey": "123456", "Number": 1 }, "_links": { "self": { "href": "localhost:3000/devint/customers?status=true&page=1&size=3&startkey=123456", "nextHref": "localhost:3000/devint/customers?status=true&page=2&size=3&startkey=123456" } } })

  });

  it('get active customers record (no api key in api gateway)', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, {
        Items: [{ CustomerID: "1234", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "12345", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "123456", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }],
        Count: 10
      });
    })

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, { items: [] });
    });

    let event = {
      "queryStringParameters": { status: 'true', page: 1, size: 3 },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    expect(JSON.parse(actual.body)).toStrictEqual({ "Customers": [{ "CustomerID": "1234", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }, { "CustomerID": "12345", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }, { "CustomerID": "123456", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }], "Page": { "Size": 3, "TotalElement": 10, "TotalPages": 3, "Number": 1 }, "_links": { "self": { "href": "localhost:3000/devint/customers?status=true&page=1&size=3&startkey=0" } } })

  });

  it('error from api gateway', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, {
        Items: [{ CustomerID: "1234", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "12345", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }, { CustomerID: "123456", BillToAcct: "15733", CustomerNo: "WX", DeclaredType: "LL", SourceSystem: "TR", Station: "TT", CustomerStatus: "Active" }], LastEvaluatedKey: { 'CustomerID': '123456' },
        Count: 10
      });
    })

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback({ error: "apigateway error" }, null);
    });

    let event = {
      "queryStringParameters": { status: 'true', page: 1, size: 3, startkey: '123456' },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    expect(JSON.parse(actual.body)).toStrictEqual({ "Customers": [{ "CustomerID": "1234", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }, { "CustomerID": "12345", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }, { "CustomerID": "123456", "BillToAcct": "15733", "CustomerNo": "WX", "DeclaredType": "LL", "SourceSystem": "TR", "Station": "TT", "CustomerStatus": "Active", "Created": "NA", "Updated": "NA", "Age": "NA" }], "Page": { "Size": 3, "TotalElement": 10, "TotalPages": 3, "Number": 1, "StartKey": "123456","CustomerStatus": true }, "_links": { "self": { "href": "localhost:3000/devint/customers?status=true&page=1&size=3&startkey=123456", "nextHref": "localhost:3000/devint/customers?status=true&page=2&size=3&startkey=123456" } } })

  });

  it('no records found', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: [] });
    })

    AWSMock.mock('DynamoDB', 'describeTable', (params, callback) => {
      callback(null, { Table: { ItemCount: '0' } });
    })

    let event = {
      "queryStringParameters": { status: 'false', page: 1, size: 3 },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    expect(JSON.parse(actual.body)).toStrictEqual({ "Customers": [], "Page": { "Number": 1 }, "_links": { "self": { "href": "localhost:3000/devint/customers?status=false&page=1&size=3&startkey=0" } } });
  });

  it('bad request error from scan operation', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback({ "error": "error found" }, null);
    })

    AWSMock.mock('DynamoDB', 'describeTable', (params, callback) => {
      callback(null, { Table: { ItemCount: '0' } })
    })

    let event = {
      "queryStringParameters": { status: 'false' },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    expect(JSON.parse(actual.body)).toStrictEqual({ "message": "Bad Request", "error": { "error": "error found" } });

  });

  it('validation error check', async () => {

    let event = {
      "queryStringParameters": { status: 'sdkjf', page: 1, size: 3 },
      "ACCOUNTINFOTABLE": "test-table",
      "headers": { "Host": "localhost:3000" },
      "path": "/customers",
      "requestContext": { "stage": "devint" }
    }

    let actual = await wrapped.run(event);
    expect(actual.body).toStrictEqual('{"message":"missing required parameters","error":{"_original":{"status":"sdkjf","page":1,"size":3},"details":[{"message":"\\"status\\" must be a boolean","path":["status"],"type":"boolean.base","context":{"label":"status","value":"sdkjf","key":"status"}}]}}');
  });

});