async function createPagination(event, results, status, page, size) {

  let response = {
    "Customers": results.Items,
  }
  if(results.LastEvaluatedKey){
        page = parseInt(page);
        page += 1
        response['nextPage'] = "http://" + event['headers']['Host'] + event['path'] + "/?status=" + status + "&page=" + page + "&size=" + size + "&startkey=" + results.LastEvaluatedKey.CustomerID;
  }
    return response
}

module.exports = {
  createPagination
}