'use strict';

const mod = require('./../src/CustomerOnboarding/GetCustomersList/index');
const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });
const AWSMock = require('aws-sdk-mock');

const scanResponse = require('../src/TestEvents/GetCustomersList/MockResponses/dynamo-scan.json');
const scanDataResponse = require('../src/TestEvents/GetCustomersList/MockResponses/scan-data.json');
const scanNoActiveResponse = require('../src/TestEvents/GetCustomersList/MockResponses/scan-no-active-data.json');
const scanResponseNoLastKey = require('../src/TestEvents/GetCustomersList/MockResponses/dynamo-scan-no-last-key.json');
const apiKeysResponse = require('../src/TestEvents/GetCustomersList/MockResponses/api-gw-apikeys.json');
const apiKeysTwoResponse = require('../src/TestEvents/GetCustomersList/MockResponses/api-gw-apikeys-startkey.json');
const batchGetResponse = require('../src/TestEvents/GetCustomersList/MockResponses/dynamo-batchget.json');

describe('module test', () => {

  afterEach(() => {
    AWSMock.restore();
  });

  it('get all customers record with default page, limit and startkey', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanResponseNoLastKey);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/GetCustomersList/ExpectedResponses/result.json');
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

  });

  it('get all customers record with page, size and startkey', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-with-startkey.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/GetCustomersList/ExpectedResponses/result-startkey.json');
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);
  });

  it('get active customers record with api keys (match key in apigateway) with startkey', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-startkey.json');
    const result = await wrapped.run(event);
    let expectedResponse = require('../src/TestEvents/GetCustomersList/ExpectedResponses/result-true-startkey.json');
    let age = JSON.parse(result.body).Customers[0].Age;
    expectedResponse.Customers[0].Age = age;
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

  });

  it('get active customers record with api keys (match key in apigateway)', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysTwoResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-startkey.json');
    const result = await wrapped.run(event);
    let expectedResponse = require('../src/TestEvents/GetCustomersList/ExpectedResponses/result-true-startkey-multiplerecord.json');
    let age1 = JSON.parse(result.body).Customers[0].Age;
    expectedResponse.Customers[0].Age = age1;
    let age2 = JSON.parse(result.body).Customers[1].Age;
    expectedResponse.Customers[1].Age = age2;
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

  });

  it('get all customers record with startkey is true', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-startkey.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/GetCustomersList/ExpectedResponses/result-startkey-true.json');
    let age1 = JSON.parse(result.body).Customers[0].Age;
    expectedResponse.Customers[0].Age = age1;
    let age2 = JSON.parse(result.body).Customers[1].Age;
    expectedResponse.Customers[1].Age = age2;
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);
  });

  it('get active customers record (no api key in api gateway)', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, { items: [] });
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-no-startkey.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/GetCustomersList/ExpectedResponses/result-true-no-startkey.json');
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse)

  });

  it('error from api gateway', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback({ error: "apigateway error" }, null);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-startkey.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/GetCustomersList/ExpectedResponses/api-gw-error.json');
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse)

  });

  it('no records', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: [] });
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-startkey.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}';
    expect(result.body).toStrictEqual(expectedResponse)

  });

  it('bad request error from scan operation', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback({ "error": "error found" }, null);
    })

    const event = require('../src/TestEvents/GetCustomersList/Events/event-false-only.json');
    const result = await wrapped.run(event);
    const error = '{\"httpStatus\":400,\"code\":1005,\"message\":\"Unknown error occured.\"}';
    expect(result.body).toEqual(error);

  });

  it('validation error check', async () => {

    const event = require('../src/TestEvents/GetCustomersList/Events/event-invalid-status.json');
    let actual = await wrapped.run(event);
    const error = '{"httpStatus":400,"code":1001,"message":"\\"queryStringParameters.status\\" must be a boolean"}';
    expect(actual.body).toEqual(error);
  });

  it('In status true condition page invalid', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-invalid-page.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1018,"message":"Page not found."}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('In status false condition page invalid', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-false-invalid-page.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1018,"message":"Page not found."}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('active customer not found', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNoActiveResponse);
    })

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event-true-startkey.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{\"httpStatus\":400,\"code\":1009,\"message\":\"Item not found.\"}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('bad request error from batchGet operation', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanDataResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback({ "error": "error found" }, null);
    });

    const event = require('../src/TestEvents/GetCustomersList/Events/event.json');
    const result = await wrapped.run(event);
    const error = '{\"httpStatus\":400,\"code\":1005,\"message\":\"Unknown error occured.\"}';
    expect(result.body).toEqual(error);

  });

});