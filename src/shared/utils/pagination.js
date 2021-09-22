async function createPagination(response, responseArrayName, startkey, endkey, host, path, page, size, totalCount, selfPageLink) {
  let currentPageResult
  let lastPageLink = "N/A";
  let nextPageLink = "N/A";
  let previousPageLink = "N/A";
  let resp = {}
  const hostPath = host + path

  const result = new Array(Math.ceil(response.length / (size)))
    .fill()
    .map(_ => response.splice(0, (size)))
  currentPageResult = result[page - 1]
  const previousPageArray = result[page - 2]
  const lastPageArray = result[(result.length) - 2]
 
  if (!(currentPageResult.length < size) && result[page] != undefined) {
    nextPageLink = hostPath + "page=" + (page + 1) + "&size=" +
      size + "&startkey=" + currentPageResult[currentPageResult.length - 1][startkey]
    if (endkey) {
      nextPageLink += "&endkey=" + currentPageResult[currentPageResult.length - 1][endkey];
    }
  }
  if(lastPageArray){
    lastPageLink = hostPath + "page=" + result.length + "&size=" +
    size + "&startkey=" + lastPageArray[(lastPageArray.length) - 1][startkey]
  if (endkey) {
    lastPageLink += "&endkey=" + lastPageArray[(lastPageArray.length) - 1][endkey];
  }
  }


  if (previousPageArray) {
    previousPageLink = hostPath + "page=" + (page - 1) + "&size=" +
      size + "&startkey=" + previousPageArray[0][startkey]
    if (endkey) {
      previousPageLink += "&endkey=" + previousPageArray[0][endkey];
    }
  }

  resp[responseArrayName] = currentPageResult;
  page = parseInt(page);
  let pageObject = {};
  if (currentPageResult) {
    pageObject['Size'] = currentPageResult.length;
  }
  if (totalCount != 0) {
    pageObject['TotalElement'] = totalCount;
  }
  if (Math.ceil(totalCount / size)) {
    pageObject['TotalPages'] = Math.ceil(totalCount / (size))
  }
  if (page != 0) {
    pageObject['Number'] = page;
  }
  resp["Page"] = pageObject;
  let firstLink = hostPath + "page=1" + "&size=" + size + "&startkey=0"
  if(endkey){
    firstLink +=  "&endkey=0"
  }
  resp["_links"] = {
    "self": {
      "href": hostPath + selfPageLink
    },
    "first": {
      "href": firstLink
    },
    "last": {
      "href": lastPageLink
    },
    "next": {
      "href": nextPageLink
    },
    "previous": {
      "href": previousPageLink
    }
  };
  return resp;
}

module.exports = {
  createPagination
};