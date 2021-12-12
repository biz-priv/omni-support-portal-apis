'use strict';

const mod = require('./../src/CustomerOnboarding/PostCustomer/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });
 
const AWSMock = require('aws-sdk-mock');
var axios = require("axios");
var MockAdapter = require("axios-mock-adapter");
// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);
const { Client } = require('pg');

const queryResponse = require('../src/TestEvents/PostCustomer/MockResponses/query-dynamo.json');
const createApiGatewayResponse = require('../src/TestEvents/PostCustomer/MockResponses/apigateway-createapikey.json');
const createUsagePlanResponse = require('../src/TestEvents/PostCustomer/MockResponses/apigateway-createusageplankey.json');
jest.mock('pg', () => {
    const mClient = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    };
    return { Client: jest.fn(() => mClient) };
  });
describe('post module test', () => {
    let client;
    beforeEach(() => {
      client = new Client();
    });
    
      afterEach(() => {
        AWSMock.restore();
    });
    it('Insert customer record in db, create apikey and add to usage plan', async () => {

        client.query.mockResolvedValueOnce({ rows:  [ { id: '10087048', source_system: 'WT', cust_nbr: '987656' } ], rowCount: 1 });

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, { Items: [] });
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, createApiGatewayResponse);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, createUsagePlanResponse)
        })

        mock.onPost().reply(200);

        const event = require('../src/TestEvents/PostCustomer/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        expect(actual.statusCode).toStrictEqual(202);
    })
    
    it('Customer already exists.', async () => {

        client.query.mockResolvedValueOnce({ rows:  [ { id: '10087048', source_system: 'WT', cust_nbr: '987656' } ], rowCount: 1 });

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, queryResponse);
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, createApiGatewayResponse);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, createUsagePlanResponse)
        })

        mock.onPost().reply(200);

        const event = require('../src/TestEvents/PostCustomer/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        const expectedResult = '{"httpStatus":400,"code":1021,"message":"Customer already exists."}'
        expect(actual.body).toStrictEqual(expectedResult);
    })

    it('Customer not exists', async () => {

        client.query.mockResolvedValueOnce({ rows:  [], rowCount: 0 });

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, queryResponse);
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, createApiGatewayResponse);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, createUsagePlanResponse)
        })

        mock.onPost().reply(200);

        const event = require('../src/TestEvents/PostCustomer/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        const expectedResult = '{"httpStatus":400,"code":1022,"message":"Customer does not exists."}'
        expect(actual.body).toStrictEqual(expectedResult);
    })

    it('error in update user activity', async () => {

        client.query.mockResolvedValueOnce({ rows:  [ { id: '10087048', source_system: 'WT', cust_nbr: '987656' } ], rowCount: 1 });

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, { Items: [] });
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, createApiGatewayResponse);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, createUsagePlanResponse)
        })

        mock.onPost().reply(400);

        const event = require('../src/TestEvents/PostCustomer/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        expect(actual.statusCode).toStrictEqual(202);
    })

    it('error from db', async () => {

        client.query.mockResolvedValueOnce({ rows:  [ { id: '10087048', source_system: 'WT', cust_nbr: '987656' } ], rowCount: 1 });

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback({ "error": "error found" }, null);
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback({ "error": "error found" }, null);
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, createApiGatewayResponse);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, createUsagePlanResponse)
        })

        const event = require('../src/TestEvents/PostCustomer/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1003,"message":"Error getting items."}'
        expect(actual.body).toStrictEqual(error);
    })

    it('error from createapi key', async () => {

        client.query.mockResolvedValueOnce({ rows:  [ { id: '10087048', source_system: 'WT', cust_nbr: '987656' } ], rowCount: 1 });

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
            callback(null, { Items: [] });
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback({ "error": "apigateway error" }, null);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback({ "error": "usageplan error" }, null)
        })

        const event = require('../src/TestEvents/PostCustomer/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1006,"message":"Error creating apikey."}'
        expect(actual.body).toStrictEqual(error);
    })

    it('validation missing field error', async () => {

        const event = require('../src/TestEvents/PostCustomer/Events/event-missing-body-parameter.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"body.SourceSystem\\" is required"}'
        expect(actual.body).toStrictEqual(error);
    });

    it('validation invalid request parameter type', async () => {

        const event = require('../src/TestEvents/PostCustomer/Events/event-invalid-body-parameter.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"body.BillToAccNumber\\" is not allowed\"}'
        expect(actual.body).toStrictEqual(error);
    });

});