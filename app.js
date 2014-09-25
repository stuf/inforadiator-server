'use strict';

var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');

var fs = require('fs');
var util = require('util');
var http = require('http');
var Q = require('q');
var _ = require('underscore');

var router = express.Router();
var app = express();

var VERSION = '0.0.5';

// Eyecandy
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
var routes = './routes';

fs.readdirSync(routes).forEach(function (it, i, list) {
  util.log(util.format('Including module %s (%d/%d)', it.bold, (i + 1), list.length));
  var mod = require(routes + '/' + it);
  app.use(base, mod.router);
});

util.log('...Done.');

util.log(util.format('Attaching routing to base URL %s', base.bold));
app.use(base, router);

// Finally
// ===================================z==========================================
util.log('Preparing to serve...');
app.listen(port);
util.log('...Done.');

util.log('Serving at port ' + ('' + port).bold);

module.exports = app;
