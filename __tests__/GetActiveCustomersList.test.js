'use strict';

const mod = require('./../src/CustomerOnboarding/GetActiveCustomersList/index');
const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });
const AWSMock = require('aws-sdk-mock');

const queryResponse = require('../src/TestEvents/GetActiveCustomersList/MockResponses/dynamo-query.json');

describe('module test', () => {

  afterEach(() => {
    AWSMock.restore();
  });

  it('get all active customers record', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, queryResponse);
    });

    const event = require('../src/TestEvents/GetActiveCustomersList/Events/event.json');
    const result = await wrapped.run(event);
    const expectedResponse = require('../src/TestEvents/GetActiveCustomersList/ExpectedResponses/result.json');
    expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

  });

  it('no active customers found', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, { Items: []});
    });

    const event = require('../src/TestEvents/GetActiveCustomersList/Events/event.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{\"httpStatus\":400,\"code\":1009,\"message\":\"Item not found.\"}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

  it('error from database', async () => {

    AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback({"error": "error found"}, null);
    });

    const event = require('../src/TestEvents/GetActiveCustomersList/Events/event.json');
    const result = await wrapped.run(event);
    const expectedResponse = '{\"httpStatus\":400,\"code\":1003,\"message\":\"Error getting items.\"}';
    expect(result.body).toStrictEqual(expectedResponse);

  });

});