const { success, failure } = require('../../shared/utils/responses');
const Joi = require('joi');
const Dynamo = require('../../shared/dynamoDB/operations/dynamoOperations');
const pagination = require('../../shared/utils/pagination');
//const ACCOUNTINFOTABLE = process.env.ACCOUNT_INFO;
 const ACCOUNTINFOTABLE = 'account-info-dev'
// const TOKENVALIDATORTABLE = process.env.TOKEN_VALIDATOR;

/*=================get customers parameters validate==============*/
var statusValidator = Joi.object().keys({
    status: Joi.boolean(),
    page: Joi.number(),
    size: Joi.number(),
    startkey: Joi.string()
})

//get customers list 
async function handler(event){
    var query = (!event.queryStringParameters ? null : event.queryStringParameters);
    console.info("Event\n" + JSON.stringify(event, null, 2));
    if (query == null) {
        query = { status: 'false' }
    }
    let page = (query.page == undefined) ? 1 : query.page;
    console.log(page);
    let size = (query.size == undefined) ? 3 : query.size;
    console.log(size)
    //validate query parameter
    const { error, value } = await statusValidator.validate(query);
    if (error) {
        console.error("Error\n" + JSON.stringify(error, null, 2));
        return failure(400, "missing required parameters", error);
    } else {
        let status = (query.status == 'true') ? "Active" : "Inactive";
        let tableName = (ACCOUNTINFOTABLE ? ACCOUNTINFOTABLE : event.ACCOUNTINFOTABLE);
        let results
        if (status == 'Active') {
            let accountInfo = await Dynamo.searchTable(tableName, status, size, query.startkey);
            //let accountInfo = await Dynamo.searchTable(tableName, 'Status', status);
             console.log("accoutnInfo-------> ",accountInfo)
                results = await Dynamo.fetchApiKey(accountInfo);
                console.log("results----> ",results)
        } else {
            results = await Dynamo.fetchAllCustomers(tableName, status, size, query.startkey);
            //results = await Dynamo.getCustomer({TableName: tableName, Limit: query.size });
        }

        if (!results.error) {
            var response = await pagination.createPagination(event, results.data, query.status, page, size);
            console.log("======================================================")
            console.log(response);
            console.log("======================================================")
            
            console.info("Response\n" + JSON.stringify(response, null, 2));
            return success(200, response);
        } else {
            console.error("Error\n" + JSON.stringify(results.error, null, 2));
            return failure(400, "Bad Request", results.error);
        }
    }

}

module.exports = {
    handler
}