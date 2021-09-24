'use strict';

const mod = require('./../src/UserActivity/AllUsersActivityList/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');

const scanResponse = require('../src/TestEvents/AllUsersActivityList/MockResponses/dynamo-scan.json');
const scanDataResponse = require('../src/TestEvents/AllUsersActivityList/MockResponses/dynamo-scan-data.json');

describe('module test', () => {

    afterEach(() => {
        AWSMock.restore();
    });

    it('get all record with default page, limit, startkey and endkey', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanResponse);
        });

        const event = require('../src/TestEvents/AllUsersActivityList/Events/event-qs-null.json');
        const result = await wrapped.run(event);
        const expectedResponse = require('../src/TestEvents/AllUsersActivityList/ExpectedResponses/result-no-lastevaluatedkey.json');
        expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);
    });

    it('no records found', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, { Items: [] });
        })

        const event = require('../src/TestEvents/AllUsersActivityList/Events/event-qs-null.json');
        const result = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":400,"code":1009,"message":"Item not found."}'
        expect(result.body).toStrictEqual(expectedResponse);
    });

    it('bad request error from db operation', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback({ "error": "error found" }, null);
        })

        const event = require('../src/TestEvents/AllUsersActivityList/Events/event.json');
        let actual = await wrapped.run(event);
        const error =  '{\"error\":\"error found\"}';
        expect(actual.body).toEqual(error);

    });

    it('validation error when page 2, startkey should not be 0', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanResponse);
        })

        const event = require('../src/TestEvents/AllUsersActivityList/Events/event-with-invalid-values.json');
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"queryStringParameters.startkey\\\" contains an invalid value\"}';
        expect(actual.body).toEqual(error);

    });

    it('validation error check', async () => {

        const event = require('../src/TestEvents/AllUsersActivityList/Events/event-invalid-parameter.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"queryStringParameters.start\\" is not allowed"}';
        expect(actual.body).toEqual(error);
    });

    it('page invalid', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
          callback(null, scanDataResponse);
        })
    
        const event = require('../src/TestEvents/AllUsersActivityList/Events/event-invalid-page.json');
        const result = await wrapped.run(event);
        const expectedResponse = '{"httpStatus":400,"code":1018,"message":"Page not found."}';
        expect(result.body).toStrictEqual(expectedResponse);
    
      });

      it('previous link in response', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
            callback(null, scanDataResponse);
        });

        const event = require('../src/TestEvents/AllUsersActivityList/Events/event-next-page.json');
        const result = await wrapped.run(event);
        const expectedResponse = require('../src/TestEvents/AllUsersActivityList/ExpectedResponses/result-with-previous-pagelink.json');
        expect(JSON.parse(result.body)).toStrictEqual(expectedResponse);
    });


});