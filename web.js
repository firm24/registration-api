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
  var createCompany = (request.env.company ? request.env.company.toLowerCase() === 'true' : false);

  return new Promise(function(resolve, reject) {

    var form = request.post;
    var user = {};
    user.email = form.email;
    user.password = form.password;


    if (form.name) {
      var names = form.name.split(' ');
      user.first_name = names.shift();
      user.last_name = names.join(' ');
    } else {
      user.first_name = form.first_name;
      user.last_name = form.last_name;
    }

    if (form.referrer || form.referral || request.env.referral) {
      user.referral = form.referrer || form.referral || request.env.referral;
    }

    var companyName = null;
    if (form.company && form.company !== '') {
      companyName = form.company;
    } else if (createCompany) {
      companyName = user.first_name + ' ' + user.last_name;
    }

    if (companyName) {
      user.employment = {
        organization: {
          name: companyName
        }
      };
    }

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

api.post('/activecampaign', function (request) {
  "use strict";

  var iamUrl = (request.env.iam ? request.env.iam : 'http://firm24.docarama.com/service/iam');
  var iam = new IAM(iamUrl);

  return new Promise(function(resolve, reject) {

    var form = request.post;
    var user = {};
    user.email = form['contact[email]'];
    user.first_name = form['contact[first_name]'];
    user.last_name = form['contact[last_name]'];

    user.referral = request.env.referral || 'firm24';

    iam.registerUser(user).then(function(res){
      resolve('OK');
    }).catch(function(err) {
      resolve('Error: ' + err.message);
    });
  });
}, {success: { contentType: 'text/plain', code: 201 }});

api.post('/login', function (request) {
  "use strict";

  var iamUrl = (request.env.iam ? request.env.iam : 'https://mijn.firm24.com/service/iam');
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

    var origin = (request.headers.Referer ? request.headers.Referer.replace(/\/$/, '') : 'https://mijn.firm24.com/aanmelden');

    iam.createSession(user).then(function(session) {
      var url = new Url(redirect);
      url.query.hash = session.id;

      if (request.queryString.template) {
        url.query.template = request.queryString.template;
      }

      if (request.queryString.package) {
        url.query.package = request.queryString.package;
      }

      resolve(new api.ApiResponse('OK', {'Location': url.toString()}));
    }).catch(function(err) {
      var error = 'error-login';
      resolve(new api.ApiResponse('Error', {'Location': origin + '#' + error}));
    });
  });
},{success: {code: 303, headers: ['Location']}});

api.get('/forgot', function (request) {
  "use strict";

  var iamUrl = (request.env.iam ? request.env.iam : 'https://mijn.firm24.com/service/iam');
  var iam = new IAM(iamUrl);

  return new Promise(function(resolve, reject) {

    var user = {};
    user.email = request.queryString.email;
    user.forgotpassword = true;

    iam.createSession(user).then(function() {
      resolve(request.queryString.callback + '({\'result\': 0});');
    }).catch(function(err) {
      resolve(request.queryString.callback + '({\'result\': 2});');
    });
  });
}, {success: { contentType: 'text/javascript' }});