'use strict';

const mod = require('./../src/Subscription/DeleteWebhooks/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');
var axios = require("axios");
var MockAdapter = require("axios-mock-adapter");

// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);

const indexQueryResponse = require('../src/TestEvents/DeleteWebhooks/MockResponses/dynamo-query-response.json');
const getResponse = require('../src/TestEvents/DeleteWebhooks/MockResponses/dynamo-get-response.json');
const indexQueryNoDataResponse = require('../src/TestEvents/DeleteWebhooks/MockResponses/dynamo-query-no-data.json');

describe('module test', () => {

    afterEach(() => {
        AWSMock.restore();
    });

    it('unsubscribe topic successfully', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse);
        });

        AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
            callback(null, "successfully unsubscribe");
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        mock.onPost().reply(200);

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        expect(result.statusCode).toStrictEqual(200);

    });

    it('error in update activity', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse);
        });

        AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
            callback(null, "successfully unsubscribe");
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        mock.onPost().reply(400);

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        expect(result.statusCode).toStrictEqual(200);

    });

    it('invalid apikey found error', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, {});
        });

        AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
            callback(null, "successfully unsubscribe");
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1019,"message":"Invalid EventType."}'
        expect(result.body).toStrictEqual(error);

    });

    it('data not found error', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryNoDataResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse);
        });

        AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
            callback(null, "successfully unsubscribe");
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1014,"message":"Invalid apikey."}'
        expect(result.body).toStrictEqual(error);

    });

    it('error in topic unsubscription', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse);
        });

        AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
            callback("error found", null);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1015,"message":"Error from unsubscription."}'
        expect(result.body).toStrictEqual(error);

    });

    it('error from dynamodb operations', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback("error found", null);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback("error found", null);
        });

        AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
            callback(null, "successfully unsubscribe");
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1002,"message":"Error fetching details."}'
        expect(result.body).toStrictEqual(error);

    });

    it('validation header parameters error', async () => {
        const event = require('../src/TestEvents/DeleteWebhooks/Events/event-without-x-api-key.json');
        const result = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"headers.x-api-key\\" is required"}'
        expect(result.body).toStrictEqual(error);

    });    

    it('validation body parameters error', async () => {
        const event = require('../src/TestEvents/DeleteWebhooks/Events/event-without-body-parameters.json');
        const result = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"body\\" must be of type object"}'
        expect(result.body).toStrictEqual(error);
    });

    it('error from dynamodb delete operations', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse);
        });

        AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
            callback(null, "successfully unsubscribe");
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback({"error": "error found"}, null);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
            callback(null, {});
        });

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        const error = { code: 1016, httpStatus: 400, message: "Error deleting item." }
        expect(JSON.parse(result.body)).toStrictEqual(error);

    });

});