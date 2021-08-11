"use strict";

const mod = require("../src/Subscription/PostSubscriptions/index");

const jestPlugin = require("serverless-jest-plugin");
const lambdaWrapper = jestPlugin.lambdaWrapper;
const wrapped = lambdaWrapper.wrap(mod, { handler: "handler" });

const AWSMock = require("aws-sdk-mock");

describe("post user subscriptions module test", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  it("event empty body validation", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-body-null.json");
    let actual = await wrapped.run(event);
    const error = {
      code: 1015,
      httpStatus: 400,
      message: "Missing required parameters.",
    };
    expect(actual).toStrictEqual(error);
  });

  it("event missing body parameter field error", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-missing-body-parameter.json");
    let actual = await wrapped.run(event);
    const error = {
      code: 1015,
      httpStatus: 400,
      message: "Missing required parameters.",
    };
    expect(actual).toStrictEqual(error);
  });

  it("event customer already exits", async () => {
    const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
    let actual = await wrapped.run(event);
    const error = {
      httpStatus: 400,
      code: 1014,
      message: "Subscription already exists.",
    };
    expect(actual).toStrictEqual(error);
  });

  // it("event DocumentClient", async () => {
  //   AWSMock.mock("DynamoDB.DocumentClient", "scan", (params, callback) => {
  //     callback(null, null);
  //   });
  //   const event = require("../src/TestEvents/PostSubscriptions/Events/event-valid-body.json");
  //   let actual = await wrapped.run(event);
  //   const error = {
  //     httpStatus: 400,
  //     code: 1014,
  //     message: "Subscription already exists.",
  //   };
  //   expect(actual).toStrictEqual(error);
  // });
});
