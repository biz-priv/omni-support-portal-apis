'use strict';

const mod = require('./../src/CustomerOnboarding/PostCustomer/index');

const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');

describe('post module test', () => {

    afterEach(() => {
        AWSMock.restore();
    });

    it('Insert customer record in db, create apikey and add to usage plan', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback(null, 'successfully put item in database');
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, {
                id: '6rdi1enz93',
                value: 'F8zwa5OkvTaXlUyfk5Xjh7DjEEpsiTBm3wpOpIs2',
                name: 'cb69f554-8c3b-4e20-97cb-6b2045530938',
                description: 'cb69f554-8c3b-4e20-97cb-6b2045530938',
                enabled: true,
                createdDate: "2021-07-02T10:01:41.000Z",
                lastUpdatedDate: "2021-07-02T10:01:41.000Z",
                stageKeys: []
            });
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, {
                id: '8n9fzw4ep4',
                type: 'API_KEY',
                value: 'oOVxcaAQ2x5Cbltw41aB4aDlFRNCvys34RzEe77i',
                name: 'cb69f554-8c3b-4e20-97cb-6b2045530938'
            })
        })

        let event = {}
        let body = {
            "BillToAccNumber": "21214",
            "SourceSystem": "WT",
            "CustomerNumber": "9876543212",
            "DeclaredType": "LL",
            "Station": "LAX",
            "CustomerName": "test1"
        }
        event["body"] = JSON.stringify(body);
        let actual = await wrapped.run(event);
        expect(actual.statusCode).toStrictEqual(202);
    })

    it('error from db', async () => {

        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            callback({ "error": "error found" }, null);
        })

        AWSMock.mock('APIGateway', 'createApiKey', function (APIparams, callback) {
            callback(null, {
                id: '6rdi1enz93',
                value: 'F8zwa5OkvTaXlUyfk5Xjh7DjEEpsiTBm3wpOpIs2',
                name: 'cb69f554-8c3b-4e20-97cb-6b2045530938',
                description: 'cb69f554-8c3b-4e20-97cb-6b2045530938',
                enabled: true,
                createdDate: "2021-07-02T10:01:41.000Z",
                lastUpdatedDate: "2021-07-02T10:01:41.000Z",
                stageKeys: []
            });
        });

        AWSMock.mock('APIGateway', 'createUsagePlanKey', function (params, callback) {
            callback(null, {
                id: '8n9fzw4ep4',
                type: 'API_KEY',
                value: 'oOVxcaAQ2x5Cbltw41aB4aDlFRNCvys34RzEe77i',
                name: 'cb69f554-8c3b-4e20-97cb-6b2045530938'
            })
        })

        let event = {}
        let body = {
            "BillToAccNumber": "21214",
            "SourceSystem": "WT",
            "CustomerNumber": "9876543212",
            "DeclaredType": "LL",
            "Station": "LAX",
            "CustomerName": "test1"
        }
        event["body"] = JSON.stringify(body);
        let actual = await wrapped.run(event);
        expect(actual.body).toStrictEqual('{"message":"bad request"}');
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

        let event = {}
        let body = {
            "BillToAccNumber": "21214",
            "SourceSystem": "WT",
            "CustomerNumber": "9876543212",
            "DeclaredType": "LL",
            "Station": "LAX",
            "CustomerName": "test1"
        }
        event["body"] = JSON.stringify(body);
        let actual = await wrapped.run(event);
        expect(actual.body).toStrictEqual('{"message":"bad request"}');
    })

    it('validation missing field error', async () => {

        let event = {}
        let body = {
            "SourceSystem": "WT",
            "CustomerNumber": "9876543212",
            "DeclaredType": "LL",
            "Station": "LAX",
            "CustomerName": "test1"
        }
        event["body"] = JSON.stringify(body);
        let actual = await wrapped.run(event);
        expect(actual.body).toStrictEqual('{"message":"missing required parameters","error":{"_original":{"SourceSystem":"WT","CustomerNumber":"9876543212","DeclaredType":"LL","Station":"LAX","CustomerName":"test1"},"details":[{"message":"\\"BillToAccNumber\\" is required","path":["BillToAccNumber"],"type":"any.required","context":{"label":"BillToAccNumber","key":"BillToAccNumber"}}]}}');
    });

    it('validation invalid request parameter type', async () => {

        let event = {}
        let body = {
            "BillToAccNumber": 234234,
            "SourceSystem": "WT",
            "CustomerNumber": "9876543212",
            "DeclaredType": "LL",
            "Station": "LAX",
            "CustomerName": "test1"
        }
        event["body"] = JSON.stringify(body);
        let actual = await wrapped.run(event);
        expect(actual.body).toStrictEqual('{"message":"missing required parameters","error":{"_original":{"BillToAccNumber":234234,"SourceSystem":"WT","CustomerNumber":"9876543212","DeclaredType":"LL","Station":"LAX","CustomerName":"test1"},"details":[{"message":"\\"BillToAccNumber\\" must be a string","path":["BillToAccNumber"],"type":"string.base","context":{"label":"BillToAccNumber","value":234234,"key":"BillToAccNumber"}}]}}');
    });

});