const Dynamo = require('../operations/dynamoOperations');

// const accountInfoTableName = process.env.accountInfo;
// const tokenValidatorTableName = process.env.tokenValidator;

const getAllCustomer = async (status) => {
        if(status == 'Active'){
            var results = await Dynamo.searchTable('omni-dw-account-info-dev','Status', status);
            var fetchApiKey = await Dynamo.fetchApiKey('omni-dw-token-validator-dev', results);
            return fetchApiKey
        }else{
            var results = await Dynamo.fetchAllCustomers('omni-dw-account-info-dev');
            return results
        }
        
};


module.exports = {
    getAllCustomer
}
