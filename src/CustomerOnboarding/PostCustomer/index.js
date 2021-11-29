const { send_response, handleError } = require("../../shared/utils/responses");
const Dynamo = require("../../shared/dynamo/db");
const ACCOUNTINFOTABLE = process.env.ACCOUNT_INFO;
const TOKENVALIDATOR = process.env.TOKEN_VALIDATOR;
const USAGEPLAN = process.env.USAGE_PLAN;
const validate = require("./validate");
const get = require("lodash.get");
const UpdateActivity = require('../../shared/utils/requestPromise');
const { Client } = require("pg");

//post customer
module.exports.handler = async (event) => {
  console.info("Event\n" + JSON.stringify(event, null, 2));
  const client = new Client({
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  //validate body parameters
  event = await validate(event);
  if (!event.code) {
    let response
    try {
      await client.connect();
      response = await client.query(
        "select * from api_token where cust_nbr = " + get(event, "body.CustomerNumber")
      );
      console.info("Redshift response : ", response);
      await client.end();
    } catch (error) {
      console.error("Error : ", error);
      return send_response(400, error);
    }
    if ((response.rows).length) {
      const CustomerID = response.rows[0].id
      const accountInfoTableItems = {
        CustomerID: CustomerID,
        BillToAcct: get(event, "body.CustomerNumber"),
        CustomerNo: get(event, "body.CustomerNumber"),
        CustomerStatus: "Active",
        DeclaredType: get(event, "body.DeclaredType"),
        SourceSystem: get(event, "body.SourceSystem"),
        Station: get(event, "body.Station"),
      };
      const apiParams = {
        description: CustomerID,
        enabled: true,
        name: CustomerID,
      };
      const tokenTableItems = {
        CustomerID: CustomerID,
        CustomerName: get(event, "body.CustomerName"),
        CustomerStatus: "Active",
      };
      try {
        let getItemResult = await Dynamo.getItemQueryFilter(ACCOUNTINFOTABLE, 'CustomerID = :hkey', 'CustomerStatus = :statuskey', { ':hkey': CustomerID, ':statuskey': 'Active' });
        console.log(getItemResult)
        if (!(getItemResult.Items).length) {
          const [accountTableResult, apiKeyResult] = await Promise.all([
            Dynamo.itemInsert(ACCOUNTINFOTABLE, accountInfoTableItems),
            Dynamo.apiKeyCreate(apiParams, USAGEPLAN),
          ]);
          tokenTableItems["ApiKey"] = apiKeyResult.value;
          await Dynamo.itemInsert(TOKENVALIDATOR, tokenTableItems);
          await UpdateActivity.postRequest(event, { "activity": "CreateCustomer", "description": CustomerID + " New customer created" })
          return send_response(202);
        } else {
          return send_response(400, handleError(1021))
        }
      } catch (e) {
        console.error("Error: ", JSON.stringify(e));
        return send_response(e.httpStatus, e);
      }
    } else {
      return send_response(400, handleError(1022))
    }

  } else {
    console.error("Error: ", JSON.stringify(event));
    return send_response(event.httpStatus, event);
  }
};
