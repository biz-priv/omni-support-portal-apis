async function createPagination(response,host, path, LastEvaluatedKey, page, size) {
  if(LastEvaluatedKey){
        page = parseInt(page);
        page += 1
        response['nextPage'] = "http://" + host + path + "&page=" + page + "&size=" + size + "&startkey=" + LastEvaluatedKey;
  }
    return response
}

module.exports = {
  createPagination
}