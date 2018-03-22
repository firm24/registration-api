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
    if (form.password) {
      user.password = form.password;
    }
    user.language = (form.language ? form.language : 'nl');

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

    var GTMTag = request.env.gtmtag ? request.env.gtmtag : null;
    var TT = request.env.tt ? request.env.tt : false;
    var createdUser;

    iam.registerUser(user).then(function(res){
      createdUser = res;
      return iam.createSession(user);
    }).then(function(session){

      var url = new Url(redirect);
      url.query.hash = session.id;

      var redirectPage = "<html><head>";
      if (TT) {
        redirectPage += "<script type='text/javascript'>" +
          "var ttConversionOptions = ttConversionOptions || [];" +
          "ttConversionOptions.push({ " +
          "type: 'lead'," +
          "campaignID: '27819'," +
          "productID: '41350'," +
          "transactionID: '" + createdUser.id + "'," +
          "email: ''," +
          "descrMerchant: ''," +
          "descrAffiliate: ''" +
          "});" +
          "</script>" +
          "<noscript>" +
          "<img src='//tl.tradetracker.net/?cid=27819&amp;pid=41350&amp;tid=" + createdUser.id + "&amp;data=&amp;eml=&amp;descrMerchant=&amp;descrAffiliate=&amp;event=lead' alt='' />" +
          "</noscript>" +
          "<script type='text/javascript'>" +
          "(function(ttConversionOptions) {" +
          "  var campaignID = 'campaignID' in ttConversionOptions ? ttConversionOptions.campaignID : ('length' in ttConversionOptions && ttConversionOptions.length ? ttConversionOptions[0].campaignID : null);" +
          "  var tt = document.createElement('script'); tt.type = 'text/javascript'; tt.async = true; tt.src = '//tm.tradetracker.net/conversion?s=' + encodeURIComponent(campaignID) + '&t=m';" +
          "  var s = document.getElementsByTagName('script'); s = s[s.length - 1]; s.parentNode.insertBefore(tt, s);" +
          "})(ttConversionOptions);" +
          "</script>";
      }

      if (GTMTag) {
        redirectPage +=  "<!-- Google Tag Manager --><noscript><iframe src='//www.googletagmanager.com/ns.html?id=" + GTMTag + "' height='0' width='0' style='display:none;visibility:hidden'></iframe></noscript><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" + GTMTag + "');</script><!-- End Google Tag Manager -->";
      }
      redirectPage +=  "<script> setTimeout(function(){window.location.href='" + url.toString() + "';}, 1)</script></head><body>U wordt ingelogd klik <a href='" + url.toString() + "'>hier</a> indien dit te lang duurt</body></html>";

      resolve(redirectPage);
    }).catch(function(err) {
      console.log('Error: ', err);
      var error = 'error-register';
      if(err.statusCode == 409) {
        error = 'error-register-exists';
      }
      reject(new api.ApiResponse('Error', {'Location': origin + '#' + error}));
    });
  });
},{success: {contentType: 'text/html'}, error: {code: 303}});

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

    var origin = (request.headers.Referer ? request.headers.Referer.replace(/\/$/, '') : redirect);

    iam.createSession(user).then(function(session) {
      var url = new Url(redirect);
      url.query.hash = session.id;

      if (request.queryString.template) {
        url.query.template = request.queryString.template;
      }

      if (request.queryString.package) {
        url.query.package = request.queryString.package;
      }

      var GTMTag = request.env.gtmtag ? request.env.gtmtag : null;
      var redirectPage = "<html><head>";
      if (GTMTag) {
        redirectPage +=  "<!-- Google Tag Manager FIRM24 --><noscript><iframe src='//www.googletagmanager.com/ns.html?id=" + GTMTag + "' height='0' width='0' style='display:none;visibility:hidden'></iframe></noscript><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" + GTMTag + "');</script><!-- End Google Tag Manager -->";
      }
      redirectPage +=  "<script> setTimeout(function(){window.location.href='" + url.toString() + "';}, 1)</script></head><body>U wordt ingelogd klik <a href='\" + url.toString() + \"'>hier</a> indien dit te lang duurt</body></html>";

      resolve(redirectPage);
    }).catch(function(err) {
      var error = 'error-login';
      reject(new api.ApiResponse('Error', {'Location': origin + '#' + error}));
    });
  });
},{success: {contentType: 'text/html'}, error: {code: 303}});

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