const aws = require('aws-sdk');
const { handler } = require('../src/CustomerOnboarding/GetCustomersList/index');

jest.mock('aws-sdk', () => {
  const mDocumentClient = { get: jest.fn(), scan: jest.fn() };
  const mDynamoDB = { DocumentClient: jest.fn(() => mDocumentClient) };
  return { DynamoDB: mDynamoDB };
});
const mDynamoDb = new aws.DynamoDB.DocumentClient();

describe('Test module', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });
  it('should get user', async () => {
    const mResult = { CustomerID: '10045320' };
    mDynamoDb.scan.mockImplementationOnce((_, callback) => callback(null, mResult));

    let event = {
      "queryStringParameters": { status: 'false' },
      "ACCOUNTINFOTABLE": "test-table"
    }
    const actual = await handler(event);
    // console.log(actual.body);
    expect(JSON.parse(actual.body)).toEqual({Customers:{CustomerID:"10045320"}});

  });

  it('should handler error', async () => {
    const mError = new Error('network');
    mDynamoDb.scan.mockImplementationOnce((_, callback) => callback(mError));
    let event = {
      "queryStringParameters": { status: 'false' },
      "ACCOUNTINFOTABLE": "test-table"
    }
    await expect(handler(event)).rejects.toThrowError('network');
  });
});