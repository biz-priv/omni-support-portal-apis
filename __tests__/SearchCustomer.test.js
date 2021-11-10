'use strict';

const mod = require('./../src/CustomerOnboarding/SearchCustomer/index');
const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });
const AWSMock = require('aws-sdk-mock');

const scanNumberResponse = require('../src/TestEvents/SearchCustomer/MockResponses/scan-customer-no-data.json');
const scanNameResponse = require('../src/TestEvents/SearchCustomer/MockResponses/scan-customer-name-data.json');
const apiKeysResponse = require('../src/TestEvents/SearchCustomer/MockResponses/api-gw-apikeys.json');
const batchGetAccountResponse = require('../src/TestEvents/SearchCustomer/MockResponses/dynamo-accounttable-batchget.json');
const batchGetTokenResponse = require('../src/TestEvents/SearchCustomer/MockResponses/dynamo-tokentable-batchget.json');
const batchGetAccountInfoResponse = require('../src/TestEvents/SearchCustomer/MockResponses/dynamo-accountInfotable-batchget.json');
const batchGetActiveResponse = require('../src/TestEvents/SearchCustomer/MockResponses/dynamo-accountInfoActivetable-batchget.json')
describe('module test', () => {

  afterEach(() => {
    AWSMock.restore();
  });

  it('search customer by using customer number', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNumberResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetTokenResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-number.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/SearchCustomer/ExpectedResponses/customer-number-result.json');
    let age = JSON.parse(result.body).Customers[2].Age;
    expectedResponse.Customers[2].Age = age;
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

  });

  it('No match customer number in database', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: []});
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetTokenResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-number.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('search customer by using customer name', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNameResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetAccountResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-name.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/SearchCustomer/ExpectedResponses/customer-name-result.json');
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

  });

  it('No match customer name in database', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: []});
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetAccountResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-name.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}';
    expect(result.body).toStrictEqual(expectedResponse);

  });


  it('Getting error from database', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback({"error": "error found"}, null);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetAccountResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-number.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1005,"message":"Unknown error occured."}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('Getting error from apigetway', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNameResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback({"error": "error found"}, null);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetAccountResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-number.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1005,"message":"Unknown error occured."}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('Getting validation error', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNameResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetAccountResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-invalid-path-param.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1001,"message":"\\"pathParameters.id\\" must be one of [number, string]"}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('Page not found error when search by customer number', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNumberResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetTokenResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-cust-no-invalid-page.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{\"httpStatus\":404,\"code\":1018,\"message\":\"Page not found.\"}'
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('Page not found error when search by customer name', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNameResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, apiKeysResponse);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetAccountResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-cust-name-invalid-page.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{\"httpStatus\":404,\"code\":1018,\"message\":\"Page not found.\"}'
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('search customer by using customer name where apikey not found', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNameResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, { items: []});
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetAccountInfoResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-name.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/SearchCustomer/ExpectedResponses/result-without-apikey.json');
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

  });

  it('item not found in search customer name', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, scanNameResponse);
    });

    AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
      callback(null, { items: []});
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', (params, callback) => {
      callback(null, batchGetActiveResponse);
    });

    const event = require('../src/TestEvents/SearchCustomer/Events/event-request-customer-name.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

});