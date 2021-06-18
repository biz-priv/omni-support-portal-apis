/*============================================================= */
// success response
function success(http_code, data = null){

    return send_callback(data, http_code);
}
/*============================================================= */
// failure response
function failure(http_code, message, error){
    const response = {
        message: message,
        error: error
    }
    return send_callback(response, http_code);
}
/*============================================================= */
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

}
/*============================================================= */
module.exports = {
    success,
    failure,
    send_callback
}