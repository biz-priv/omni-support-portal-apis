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

  it("event empty body validation", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-body-null.json");
    let actual = await wrapped.run(event);
    const error = "{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"body\\\" must be of type object\"}";
    expect(actual.body).toStrictEqual(error);
  });

  it("event missing body parameter EventType", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-EventType.json");
    let actual = await wrapped.run(event);
    const error = "{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"body.EventType\\\" is required\"}";
    expect(actual.body).toStrictEqual(error);
  });

  it("event missing body parameter Endpoint", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-Endpoint.json");
    let actual = await wrapped.run(event);
    const error = "{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"body.Endpoint\\\" is required\"}"
    expect(actual.body).toStrictEqual(error);
  });

  it("event missing body parameter SharedSecret", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-SharedSecret.json");
    let actual = await wrapped.run(event);
    const error = "{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"body.SharedSecret\\\" is required\"}"
    expect(actual.body).toStrictEqual(error);
  });

  it("event missing body parameter Preference", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-Preference.json");
    let actual = await wrapped.run(event);
    const error = "{\"httpStatus\":400,\"code\":1001,\"message\":\"\\\"body.Preference\\\" is required\"}"
    expect(actual.body).toStrictEqual(error);
  });

  it("event getCustomerIdError", async () => {
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback("error", null);
    });
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    let actual = await wrapped.run(event);
    const error = "{\"httpStatus\":400,\"code\":1005,\"message\":\"getCustomerIdError: Something went wrong\"}"
    expect(actual.body).toStrictEqual(error);
  });

  it("Customer doesn't exist", async () => {
    AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
      callback(null, {});
    });
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    let actual = await wrapped.run(event);
    const error = "{\"httpStatus\":400,\"code\":1014,\"message\":\"Customer doesn't exist\"}"
    expect(actual.body).toStrictEqual(error);
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
    const error = "{\"httpStatus\":400,\"code\":1017,\"message\":\"Subscription already exists.\"}"
    expect(actual.body).toStrictEqual(error);
  });

  it("getSnsTopicDetails Error", async () => {
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
    const error = "{\"httpStatus\":400,\"code\":1017,\"message\":\"Subscription already exists.\"}"
    expect(actual.body).toStrictEqual(error);
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
    const error = "{\"httpStatus\":400,\"code\":1017,\"message\":\"Subscription already exists.\"}"
    expect(actual.body).toStrictEqual(error);
  });

  it("customer created and subscription is successfull", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    const stub = sinon.stub();

    stub.onCall(0).returns(getCustomer);
    stub.onCall(1).returns(getCustomerPreference);
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
    const msg = "{\"message\":\"Subscription successfully added\"}"
    expect(actual).toStrictEqual(msg);
  });

});
