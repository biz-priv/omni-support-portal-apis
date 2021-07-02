/*============================================================= 
// success response
function success(http_code, data = null){

    return send_callback(data, http_code);
}
/*============================================================= 
// failure response
function failure(http_code, message, error){
    const response = {
        message: message,
        error: error
    }
    return send_callback(response, http_code);
}
/*============================================================= 
// send response 
function send_callback(resp = null, http_code){
    var resonseData = ""   
    if(resp){
           var responseData = resp
            }

    return {
        statusCode: http_code,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(responseData)
    }
}*/
/*============================================================= */
module.exports = {
    // success,
    // failure,
    // send_callback,
    handleError
}

const errors = [
    //createOrder - parking
    { code: 1000, httpStatus: 500, message: 'Unable to process request.' },
    { code: 1001, httpStatus: 400, message: 'Schema validation error.' },
    { code: 1002, httpStatus: 400, message: 'Error fetching details.' },
    { code: 1003, httpStatus: 400, message: 'Error getting items.' },
    { code: 1004, httpStatus: 400, message: 'Error fetching items.' },
    { code: 1005, httpStatus: 400, message: 'Unknown error occured.' },
];

function getError (code) {
    return errors.find(e => e.code === code);
}

function handleError (code, exception=null, msg=null) {
    if (exception) {
        console.error('Exception: ', exception);
    }

    const error = getError(code);

    msg = msg || error.message;

    const errorResp = errorResponse(error.httpStatus, error.code, msg);

    console.error("Error Response: ", errorResp);
    return errorResp;
}

function errorResponse(httpStatus, errCode, message) {
    return JSON.stringify({
        httpStatus: httpStatus,
        code: errCode,
        message: message
    });
}