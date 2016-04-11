var Promise = require('bluebird');
var request = require("request-promise");

var IAM = function(api) {
  "use strict";
  this.api = api;
}

IAM.prototype.registerUser = function(user) {
  "use strict";

  var options = {
    uri: this.api + '/users',
    body: user,
    json: true
  }

  return request.post(options);
};

IAM.prototype.createSession = function(user) {
  "use strict";

  var options = {
    uri: this.api + '/sessions',
    body: user,
    json: true
  }

  return request.post(options);
}

module.exports = IAM;