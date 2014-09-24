var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');

var util = require('util');
var http = require('http');
var Q = require('q');
var _ = require('underscore');

var router = express.Router();
var app = express();

var VERSION = '0.0.2';

// Candy
require('colors');

util.log('Info Radiator RESTful API ' + VERSION.bold + '');

// =============================================================================
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

// Routing
// =============================================================================
util.log('Initialising modules:');

var base = '/api';
['reittiopas'].forEach(function (it, i, list) {
  util.log(util.format('Including module %s (%d/%d)', it.bold, (i + 1), list.length));

  try {
    var mod = require('./routes/' + it);

    app.use(base, mod.router);
  }
  catch (e) {
    util.log(util.format('\tError in loading module %s\n\n\t%j', it.bold, e));
  }
});

util.log('...Done.');

util.log('Attaching routing to base URL ' + base.bold);
app.use(base, router);

// Finally
// ===================================z==========================================
util.log('Preparing to serve...');
app.listen(port);
util.log('...Done.');

util.log('Serving at port ' + ('' + port).bold);

module.exports = app;
