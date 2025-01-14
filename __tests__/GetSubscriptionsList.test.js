'use strict';

const mod = require('./../src/Subscription/GetSubscriptionsList/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');

const scanResponse = require('../src/TestEvents/GetSubscriptionsList/MockResponses/dynamo-scan-with-lastevaluatedkey.json');
const scanDataResponse = require('../src/TestEvents/GetSubscriptionsList/MockResponses/dynamo-scan.json');
const apiKeysResponse = require('../src/TestEvents/GetSubscriptionsList/MockResponses/api-gw-apikeys.json');

describe('module test', () => {

    afterEach(() => {
        AWSMock.restore();
    });

    it('get all record with default page, limit, startkey and endkey', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanResponse);
        });

        AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
            callback(null, apiKeysResponse);
          });

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event.json');
        const result = await wrapped.run(event);
        const expectedResponse = require('../src/TestEvents/GetSubscriptionsList/ExpectedResponses/result-no-lastevaluatedkey.json');
        expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

    });

    it('api gateway error', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanResponse);
        });

        AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
            callback({error: "error found"}, null);
          });

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event.json');
        const result = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}'
        expect(result.body).toStrictEqual(expectedResponse);

    });

    it('no records found', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, { Items: [] });
        })

        AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
            callback(null, apiKeysResponse);
          });

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event.json');
        const result = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}';
        expect(result.body).toStrictEqual(expectedResponse);
    });

    it('bad request error from db operation', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback({ "error": "error found" }, null);
        })

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event.json');
        let actual = await wrapped.run(event);
        const error = '{\"error\":\"error found\"}';
        expect(actual.body).toEqual(error);

    });

    it('validation error when page 2, startkey should not be 0', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanResponse);
        })

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event-with-invalid-values.json');
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"queryStringParameters.startkey\\\" contains an invalid value\"}';
        expect(actual.body).toEqual(error);

    });

    it('event without apikey in request parameter', async () => {

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event-without-apikey.json');
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"headers.x-api-key\\\" is required\"}';
        expect(actual.body).toEqual(error);
    });

    it('validation error check', async () => {

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event-invalid-parameter.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"queryStringParameters.start\\" is not allowed"}';
        expect(actual.body).toEqual(error);
    });

    it('page invalid', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanDataResponse);
        })

        AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
            callback(null, apiKeysResponse);
          });

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event-invalid-page.json');
        let actual = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":404,"code":1018,"message":"Page not found."}';
        expect(actual.body).toStrictEqual(expectedResponse);

    });

    it('apikey not found in apigateway', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanResponse);
        });

        AWSMock.mock('APIGateway', 'getApiKeys', function (APIparams, callback) {
            callback(null, { items: []});
          });

        const event = require('../src/TestEvents/GetSubscriptionsList/Events/event.json');
        const result = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}'
        expect(result.body).toStrictEqual(expectedResponse);

    });

});