'use strict';

const mod = require('./../src/Subscription/DeleteWebhooks/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');

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

        const event = require('../src/TestEvents/DeleteWebhooks/Events/event.json');
        const result = await wrapped.run(event);
        expect(result.statusCode).toStrictEqual(200);

    });

});