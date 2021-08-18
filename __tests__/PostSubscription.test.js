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

describe("post user subscriptions module test", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  it("event empty body validation", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-body-null.json");
    let actual = await wrapped.run(event);
    const error = {
      code: 1001,
      httpStatus: 400,
      message: "value must be of type object",
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter EventType", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-EventType.json");
    let actual = await wrapped.run(event);
    const error = {
      httpStatus: 400,
      code: 1001,
      message: "EventType is required",
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter Endpoint", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-Endpoint.json");
    let actual = await wrapped.run(event);
    const error = {
      httpStatus: 400,
      code: 1001,
      message: "Endpoint is required",
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter SharedSecret", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-SharedSecret.json");
    let actual = await wrapped.run(event);
    const error = {
      httpStatus: 400,
      code: 1001,
      message: "SharedSecret is required",
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter Preference", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter-Preference.json");
    let actual = await wrapped.run(event);
    const error = {
      httpStatus: 400,
      code: 1001,
      message: "Preference is required",
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
      httpStatus: 400,
      code: 1005,
      message: "getCustomerIdError: Something went wrong",
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
      httpStatus: 400,
      code: 1014,
      message: "Subscription already exists.",
    };
    expect(actual).toStrictEqual(error);
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
      callback("null", null);
    });

    let actual = await wrapped.run(event);
    const error = {
      httpStatus: 400,
      code: 1005,
      message: "getSnsTopicDetailsError: Something went wrong",
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
      httpStatus: 400,
      code: 1005,
      message: "createCustomerPreferenceError: Unable to create customer",
    };
    expect(actual).toStrictEqual(error);
  });

  // it("sns subscribe error", async () => {
  //   const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
  //   const stub = sinon.stub();

  //   stub.onCall(0).returns(getCustomer);
  //   stub.onCall(1).returns({});
  //   AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
  //     callback(null, stub());
  //   });

  //   AWSMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
  //     callback(null, getSnsTopicDetails);
  //   });

  //   AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
  //     callback(null, {});
  //   });

  //   AWSMock.mock("SNS", "subscribe", (params, callback) => {
  //     callback(null, {});
  //   });

  //   let actual = await wrapped.run(event);
  //   let error = {
  //     httpStatus: 400,
  //     code: 1005,
  //     message: "subscribeToTopicError: sns subscribe error",
  //   };
  //   expect(actual).toStrictEqual(error);
  // });

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
});
