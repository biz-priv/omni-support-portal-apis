'use strict';

const mod = require('./../src/Subscription/GetEventTypesList/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');

const queryScanResponse = require('../src/TestEvents/GetEventTypesList/MockResponses/dynamo-scan-response.json');
const indexQueryResponse = require('../src/TestEvents/GetEventTypesList/MockResponses/dynamo-query-response.json');
const queryScanNoDataResponse = require('../src/TestEvents/GetEventTypesList/MockResponses/dynamo-scan-no-data.json');
const indexQueryNoDataResponse = require('../src/TestEvents/GetEventTypesList/MockResponses/dynamo-query-no-data.json');

describe('module test', () => {

    afterEach(() => {
        AWSMock.restore();
    });

      it('get all event types', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
          callback(null, indexQueryResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
          callback(null, queryScanResponse);
        });

        const event = require('../src/TestEvents/GetEventTypesList/Events/event.json');
        const result = await wrapped.run(event);
        const expectedResponse = require('../src/TestEvents/GetEventTypesList/ExpectedResponses/scan-result.json');
        expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);

      });

    it('apikey not found in table', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryNoDataResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, queryScanNoDataResponse);
        });

        const event = require('../src/TestEvents/GetEventTypesList/Events/event.json');
        const result = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":400,"code":1014,"message":"Invalid apikey."}';
        expect(result.body).toStrictEqual(expectedResponse);

    });

    it('Data not found in event topic table', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, indexQueryResponse);
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, queryScanNoDataResponse);
        });

        const event = require('../src/TestEvents/GetEventTypesList/Events/event.json');
        const result = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}';
        expect(result.body).toStrictEqual(expectedResponse);

    });

      it('bad request error from db operation', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
          callback({ "error": "error found" }, null);
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
          callback({ "error": "error found"}, null)
        })

        const event = require('../src/TestEvents/GetEventTypesList/Events/event.json');
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1002,\"message\":\"Error fetching details.\"}';
        expect(actual.body).toEqual(error);

      });

      it('validation error check', async () => {
        const event = require('../src/TestEvents/GetEventTypesList/Events/event-without-x-api-key.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"headers.x-api-key\\" is required\"}';
        expect(actual.body).toEqual(error);
      });

});