
// send response 
function send_response(http_code, resp = null) {
    let resonseData = ""
    if (resp) {
        responseData = resp
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
}
/*============================================================= */
module.exports = {
    send_response,
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
    { code: 1006, httpStatus: 400, message: 'Error creating apikey.' },
    { code: 1007, httpStatus: 400, message: 'Error inserting items.' },
];

function getError(code) {
    return errors.find(e => e.code === code);
}

function handleError(code, exception = null, msg = null) {
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
    return {
        httpStatus: httpStatus,
        code: errCode,
        message: message
    }
}