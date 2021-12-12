'use strict';

const mod = require('./../src/Subscription/UpdateSubscription/index');
const jestPlugin = require('serverless-jest-plugin');
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: 'handler' });

const AWSMock = require('aws-sdk-mock');
const sinon = require("sinon");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");

// This sets the mock adapter on the default instance
const mock = new MockAdapter(axios);

const scanResponse = require('../src/TestEvents/UpdateSubscription/MockResponses/dynamo-scan-response.json');
const getResponse = require('../src/TestEvents/UpdateSubscription/MockResponses/dynamo-get-response.json');
const scanPreferenceResponse = require('../src/TestEvents/UpdateSubscription/MockResponses/dynamo-scan-preference.json');

describe('put module test', () => {

    afterEach(() => {
        AWSMock.restore();
    });

    it('record update successfully preference fullpayload', async () => {

        const stub = sinon.stub();
        stub.onCall(0).returns(scanResponse);
        stub.onCall(1).returns(scanPreferenceResponse);
        AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
          callback(null, stub());
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse);
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
            callback(null, "update successfully");
        })
        mock.onPost().reply(200);
        const event = require('../src/TestEvents/UpdateSubscription/Events/event-valid-body.json');
        let actual = await wrapped.run(event);
        expect(actual.statusCode).toStrictEqual(202);
    })

    it('error in update activity', async () => {

      const stub = sinon.stub();
      stub.onCall(0).returns(scanResponse);
      stub.onCall(1).returns(scanPreferenceResponse);
      AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
        callback(null, stub());
      });

      AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
          callback(null, getResponse);
      })

      AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
          callback(null, "update successfully");
      })
      mock.onPost().reply(400);
      const event = require('../src/TestEvents/UpdateSubscription/Events/event-valid-body.json');
      let actual = await wrapped.run(event);
      expect(actual.statusCode).toStrictEqual(202);
  })

    it('record update successfully preference Change', async () => {

        const stub = sinon.stub();
        stub.onCall(0).returns(scanResponse);
        stub.onCall(1).returns(scanPreferenceResponse);
        AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
          callback(null, stub());
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse);
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
            callback(null, "update successfully");
        })

        const event = require('../src/TestEvents/UpdateSubscription/Events/event-preference-change.json');
        let actual = await wrapped.run(event);
        expect(actual.statusCode).toStrictEqual(202);
    })

    it("event empty x-api-key validation", async () => {
        const event = require("../src/TestEvents/UpdateSubscription/Events/event-missing-apikey.json");
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"headers.x-api-key\\" is required"}'
        expect(actual.body).toStrictEqual(error);
      });
    
      it("event empty body validation", async () => {
        const event = require("../src/TestEvents/UpdateSubscription/Events/event-null-body.json");
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"body\\" must be of type object"}'
        expect(actual.body).toStrictEqual(error);
      });
    
      it("event missing body parameter EventType", async () => {
        const event = require("../src/TestEvents/UpdateSubscription/Events/event-missing-eventType.json");
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1001,"message":"\\"body.EventType\\" is required"}'
        expect(actual.body).toStrictEqual(error);
      });
    
      it("event invalid preference parameter", async () => {
        const event = require("../src/TestEvents/UpdateSubscription/Events/event-invalid-preference.json");
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"body.Preference\\\" must be one of [fullPayload, change]\"}'
        expect(actual.body).toStrictEqual(error);
      });
    
      it("error from db scan operation", async () => {
        AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
          callback("error", null);
        });
        const event = require("../src/TestEvents/UpdateSubscription/Events/event-valid-body.json");
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1003,\"message\":\"Error getting items.\"}'
        expect(actual.body).toStrictEqual(error);
      });
    
      it("API Key not found in dynamodb", async () => {
        AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
          callback(null, { Items : [] });
        });
        const event = require("../src/TestEvents/UpdateSubscription/Events/event-valid-body.json");
        let actual = await wrapped.run(event);
        const error = '{"httpStatus":400,"code":1009,"message":"Item not found."}'
        expect(actual.body).toStrictEqual(error);
      });
    
      it("error from dynamo get operation", async () => {

        const stub = sinon.stub();
        stub.onCall(0).returns(scanResponse);
        stub.onCall(1).returns(scanPreferenceResponse);
        AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
          callback(null, stub());
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback({"error": "error found"}, null);
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
            callback(null, "update successfully");
        })

        const event = require("../src/TestEvents/UpdateSubscription/Events/event-valid-body.json");
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1003,\"message\":\"Error getting items.\"}'
        expect(actual.body).toStrictEqual(error);
      });
    
      it("event type not found", async () => {

        const stub = sinon.stub();
        stub.onCall(0).returns(scanResponse);
        stub.onCall(1).returns(scanPreferenceResponse);
        AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
          callback(null, stub());
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, {} );
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
            callback(null, "update successfully");
        })

        const event = require("../src/TestEvents/UpdateSubscription/Events/event-invalid-body.json");
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1019,\"message\":\"Invalid EventType.\"}'
        expect(actual.body).toStrictEqual(error);
      });

      it("event preference not found", async () => {

        const stub = sinon.stub();
        stub.onCall(0).returns(scanResponse);
        stub.onCall(1).returns({ Items: [] });
        AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
          callback(null, stub());
        });

        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            callback(null, getResponse );
        })

        AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
            callback(null, "update successfully");
        })

        const event = require("../src/TestEvents/UpdateSubscription/Events/event-invalid-body.json");
        let actual = await wrapped.run(event);
        const error = '{\"httpStatus\":400,\"code\":1020,\"message\":\"Topic not subscribed.\"}'
        expect(actual.body).toStrictEqual(error);
      });

});