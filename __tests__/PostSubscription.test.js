"use strict";

const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.DEFAULT_AWS });
const AWSMock = require("aws-sdk-mock");
AWSMock.setSDKInstance(AWS);
const sinon = require("sinon");

const mod = require("../src/Subscription/PostSubscriptions/index");
const jestPlugin = require("serverless-jest-plugin");
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: "handler" });

const getCustomer = require("../src/TestEvents/PostSubscriptions/MockResponses/customerData.json");
const getCustomerPreference = require("../src/TestEvents/PostSubscriptions/MockResponses/getCustomerPreference.json");
const getSnsTopicDetails = require("../src/TestEvents/PostSubscriptions/MockResponses/getSnsTopicDetails.json");
const snsSubscribe = require("../src/TestEvents/PostSubscriptions/MockResponses/snsSubscribe.json");
const eventSuccess = require("../src/TestEvents/PostSubscriptions/MockResponses/eventSuccess.json");
const headers = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

describe("post user subscriptions module test", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  it("event empty x-api-key validation", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-empty-xapi-key.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"x-api-key must be a string"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("event empty body validation", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-body-null.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"value must be of type object"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter EventType", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-EventType.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"EventType is required"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter Endpoint", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-Endpoint.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Endpoint is required"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter SharedSecret", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-SharedSecret.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"SharedSecret is required"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter Preference", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-Preference.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Preference is required"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("event getCustomerIdError", async () => {
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback("error", null);
    });
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Something went wrong"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("Invalid API Key", async () => {
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, {});
    });
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Invalid API Key"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("customer Subscription already exists", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    const stub = sinon.stub();
    stub.onCall(0).returns(getCustomer);
    stub.onCall(1).returns(getCustomerPreference);
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, stub());
    });

    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Subscription already exists"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("getSnsTopicDetails: Error getting items", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    const stub = sinon.stub();
    stub.onCall(0).returns(getCustomer);
    stub.onCall(1).returns({});
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, stub());
    });

    AWSMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
      callback("error", null);
    });

    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Error getting items."}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("sns topic details not found", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    const stub = sinon.stub();
    stub.onCall(0).returns(getCustomer);
    stub.onCall(1).returns({});
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, stub());
    });

    AWSMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
      callback(null, {});
    });

    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"sns topic details not found"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("Unable to create customer", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    const stub = sinon.stub();
    stub.onCall(0).returns(getCustomer);
    stub.onCall(1).returns({});
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, stub());
    });

    AWSMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
      callback(null, getSnsTopicDetails);
    });

    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback("error", null);
    });

    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Unable to create customer"}',
    };
    expect(actual).toStrictEqual(error);
  });

  it("customer created and subscription is successfull", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    const stub = sinon.stub();

    stub.onCall(0).returns(getCustomer);
    stub.onCall(1).returns({});
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, stub());
    });

    AWSMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
      callback(null, getSnsTopicDetails);
    });

    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {});
    });

    AWSMock.mock("SNS", "subscribe", (params, callback) => {
      callback(null, snsSubscribe);
    });

    let actual = await wrapped.run(event);
    expect(actual).toStrictEqual(eventSuccess);
  });

  it("Unable to subscribe", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    const stub = sinon.stub();

    stub.onCall(0).returns(getCustomer);
    stub.onCall(1).returns({});
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, stub());
    });

    AWSMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
      callback(null, getSnsTopicDetails);
    });

    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {});
    });

    AWSMock.mock("SNS", "subscribe", (params, callback) => {
      callback(null, {});
    });

    let actual = await wrapped.run(event);
    const error = {
      statusCode: 400,
      headers,
      body: '{"errorDescription":"Unable to subscribe"}',
    };
    expect(actual).toStrictEqual(error);
  });
});
