async function createPagination(response, host, path, page, size, elementCount, LastEvaluatedkey, totalCount) {
  page = parseInt(page);
  let Page = {
    "Size": elementCount,
    "TotalElement": totalCount,
    "TotalPages": parseInt(totalCount / size),
    "Number": page
  }
  response["Page"] = Page;
  if (LastEvaluatedkey) {
    page += 1
    let links = {
      "self": {
        "href": host + path + "&page=" + page + "&size=" + size + LastEvaluatedkey
      }
    }
    response["_links"] = links;
  }else {
    let links = {
      "self": {
        "href": "NA"
      }
    }
    response["_links"] = links;
  }

  return response
}

module.exports = {
  createPagination
}