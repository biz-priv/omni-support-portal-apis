async function createPagination(response, host, path, LastEvaluatedkeyFirst, LastEvaluatedkeySecond, page, size) {
  if (LastEvaluatedkeyFirst) {
    page = parseInt(page);
    page += 1
    response['nextPage'] = "http://" + host + path + "&page=" + page + "&size=" + size + "&startkey=" + LastEvaluatedkeyFirst + "&eventstatus="+ LastEvaluatedkeySecond ;
  }
  return response
}

module.exports = {
  createPagination
}