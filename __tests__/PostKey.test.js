'use strict';

const mod = require('./../src/KeyManagement/PostKey/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');

const createApiGatewayResponse = require('../src/TestEvents/PostKey/MockResponses/apigateway-createapikey.json');
const createUsagePlanResponse = require('../src/TestEvents/PostKey/MockResponses/apigateway-createusageplankey.json');

describe('post module test', () => {

    afterEach(() => {
        AWSMock.restore();
    });

    it('create apikey and add to usage plan', async () => {

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, createApiGatewayResponse);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, createUsagePlanResponse)
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        const event = require('../src/TestEvents/PostKey/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        console.log(actual);
        expect(actual.statusCode).toStrictEqual(202);
    })

    it('error from db', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback({ "error": "error found" }, null);
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, createApiGatewayResponse);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, createUsagePlanResponse)
        })

        const event = require('../src/TestEvents/PostKey/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1007,"message":"Error inserting items."}'
        expect(actual.body).toStrictEqual(error);
    })

    it('error from createapi key', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback({ "error": "apigateway error" }, null);
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback({ "error": "usageplan error" }, null)
        })

        const event = require('../src/TestEvents/PostKey/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1006,"message":"Error creating apikey."}'
        expect(actual.body).toStrictEqual(error);
    })

    it('validation missing field error', async () => {

        const event = require('../src/TestEvents/PostKey/Events/event-body-null.json');
        let actual = await wrapped.run(event);
        console.log(actual);
        const error = '{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"body\\\" must be of type object\"}'
        expect(actual.body).toStrictEqual(error);
    });

    it('validation invalid request parameter type', async () => {

        const event = require('../src/TestEvents/PostKey/Events/event-invalid-body-parameter.json');
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"body.CustomerId\\" must be a string"}'
        expect(actual.body).toStrictEqual(error);
    });

});