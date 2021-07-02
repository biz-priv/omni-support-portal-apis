const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');
const Dynamo = require('../../shared/dynamo/db');
const ACCOUNTINFOTABLE = process.env.ACCOUNT_INFO;
const TOKENVALIDATOR = process.env.TOKEN_VALIDATOR;
const USAGEPLAN = process.env.USAGE_PLAN;
const { uuid } = require('uuidv4');

/*=================create customer parameters validate==============*/
const createCustomerValidator = Joi.object().keys({
    BillToAccNumber: Joi.string().required(),
    SourceSystem: Joi.string().required(),
    CustomerNumber: Joi.string().default('NA'),
    DeclaredType: Joi.string().default('NA'),
    Station: Joi.string().default('NA'),
    CustomerName: Joi.string().default('NA')
})

//post customer 
module.exports.handler = async (event) => {
    console.info("Event\n" + JSON.stringify(event, null, 2));
    //validate body parameters
    const { error, value } = await createCustomerValidator.validate(JSON.parse(event.body));
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        const CustomerID = uuid();
        const accountInfoTableItems = {
            "CustomerID": CustomerID,
            "BillToAcct": value.BillToAccNumber,
            "CustomerNo": value.CustomerNumber,
            "CustomerStatus": 'Active',
            "DeclaredType": value.DeclaredType,
            "SourceSystem": value.SourceSystem,
            "Station": value.Station
        }
        const apiParams = {
            description: CustomerID,
            enabled: true,
            name: CustomerID
        };
        const tokenTableItems = {
            "CustomerID": CustomerID,
            "Customer_name": value.CustomerName,
            "Status": 'Active'
        }
        const [accountTableResult, apiKeyResult] = await Promise.all([Dynamo.itemInsert(ACCOUNTINFOTABLE, accountInfoTableItems), Dynamo.apiKeyCreate(apiParams, USAGEPLAN)]);
        
        if (!accountTableResult.error && !apiKeyResult.error) {
            tokenTableItems["ApiKey"] = apiKeyResult.data.value;
            await Dynamo.itemInsert(TOKENVALIDATOR, tokenTableItems)
            return success(202);
        } else {
            console.error("Error\n" + JSON.stringify('bab request', null, 2));
            return failure(400, "bad request")
        }
    }
}