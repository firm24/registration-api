var ApiBuilder = require('claudia-api-builder');
var Promise = require('bluebird');
var IAM = require('./iam');
var Url = require('domurl');
var api = new ApiBuilder();

module.exports = api;

api.post('/register', function (request) {
  "use strict";

  var iamUrl = (request.env.iam ? request.env.iam : 'http://firm24.docarama.com/service/iam');
  var iam = new IAM(iamUrl);

  return new Promise(function(resolve, reject) {

    var form = request.post;
    var names = form.name.split(' ');
    var first_name = names.shift();
    var last_name = names.join(' ');

    var user = {};
    user.email = form.email;
    user.password = form.password;
    user.first_name = first_name;
    user.last_name = last_name;
    
    var redirect = 'http://firm24.docarama.com/dashboard';
    if (form.redirect) {
      redirect = form.redirect;
    } else if (request.env.redirect) {
      redirect = request.env.redirect;
    }

    var origin = (request.headers.Referer ? request.headers.Referer.replace(/\/$/, '') : 'http://www.firm24.com/aanmelden');

    iam.registerUser(user).then(function(res){
      return iam.createSession(user);
    }).then(function(session){

      var url = new Url(redirect);
      url.query.hash = session.id;

      resolve(new api.ApiResponse('OK', {'Location': url.toString()}));
    }).catch(function(err) {
      var error = 'error-register';
      if(err.statusCode == 409) {
        error = 'error-register-exists';
      }
      resolve(new api.ApiResponse('Error', {'Location': origin + '#' + error}));
    });
  });
},{success: {code: 303, headers: ['Location']}});

api.post('/login', function (request) {
  "use strict";

  var iamUrl = (request.env.iam ? request.env.iam : 'http://firm24.docarama.com/service/iam');
  var iam = new IAM(iamUrl);

  return new Promise(function(resolve, reject) {

    var form = request.post;
    var user = {};
    user.email = form.email;
    user.password = form.password;

    var redirect = 'http://firm24.docarama.com/dashboard';
    if (form.redirect) {
      redirect = form.redirect;
    } else if (request.env.redirect) {
      redirect = request.env.redirect;
    }

    var origin = (request.headers.Referer ? request.headers.Referer.replace(/\/$/, '') : 'http://www.firm24.com/aanmelden');

    iam.createSession(user).then(function(session) {
      var url = new Url(redirect);
      url.query.hash = session.id;

      resolve(new api.ApiResponse('OK', {'Location': url.toString()}));
    }).catch(function(err) {
      var error = 'error-login';
      resolve(new api.ApiResponse('Error', {'Location': origin + '#' + error}));
    });
  });
},{success: {code: 303, headers: ['Location']}});