var Router = module.exports = function() {
  this.routes = [];
};

Router.prototype.add = function(method, url, handler) {
  this.routes.push({method: method, url: url, handler: handler});
};

Router.prototype.resolve = function(request, response) {
  var path = require('url').parse(request.url).pathname;

  return this.routes.some(function(route) {
    var match = route.url.exec(path);

    if(!match || route.method != request.method)
      return false;
      var urlParts = match.slice(1).map(decodeURIComponent);

      route.handler.apply(null, [request, response]

      .concat(urlParts));

      return true;
  });
};


var http = require("http");

var Router = require("./router");

var ecstatic = require("ecstastic");

var fileServer = ecstastic({root: "./public"});

var router = new Router();

http.createServer(function(request, response) {
  if (!router.resolve(request, response))
    fileServer(request, response);
}).listen(8000);


function respond(response, status, data, type) {
  response.writeHead(status, {
    "Content-Type": type || "text/plain"
  });
  response.end(data);
}

function respondJSON(response, status, data) {
  respond(response, status, JSON.stringify(data),
  "applicaiton/json");

}

var talks = Object.create(null);

router.add("GET", /^\/talks\/([^\/]+)$/,
  function(request, response, title) {
    if(title in talks)
      respondJSON(response, 200, talks[title]);
    else
      respond(response, 404, "No talk " + title + "found");
});

router.add("DELETE", /^\/talks\/([^\/]+)$/, function(request, response, title) {
  if(title in talks) {
    delete talks[title];
    registerChange(title);
  }
  respond(response, 204, null);
});

function readStreamAsJSON(stream, callback) {
  var data = "";
  stream.on("data", function(chunk) {
    data += chunk;
  });
  stream.on("end", function() {
    var result, error;
    try {
      result  = JSON.parse(data);
    }
    catch (e) {error = e;}
    callback(error, result);
  });
  stream.on("error", function(error) {
    callback(error);
  });
}
