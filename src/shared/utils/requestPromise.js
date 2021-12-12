const axios = require('axios').default;
const get = require('lodash.get');

function postRequest(event, data){
// Send a POST request
return new Promise((resolve, reject) => {
    const url = "https://" + get(event, 'headers.Host', null) + "/" + get(event, 'requestContext.stage', process.env.stage) + "/user/activity/" + get(event, 'body.UserId')
    axios.post(url, {
        Activity: data.activity,
        Description: data.description
      })
      .then(function (response) {
        resolve(response)
      })
      .catch(function (error) {
        console.error("Error ", error);  
        resolve(error)
      });
})
}

module.exports = {
    postRequest
  };