/**
 * reittiopas.js
 *
 * @requires express
 * @requires underscore
 * @requires http
 * @requires util
 * @requires q
 * @requires querystring
 * @requires moment
 *
 * @author Stefan Rimaila <stefan@rimaila.fi>
 */

'use strict';

var Q = require('q');
var util = require('util');
var http = require('http');
var express = require('express');
var moment = require('moment');
var queryString = require('querystring');
var router = express.Router();

var name = 'reittiopas';
var base = '/' + name;

var apiUrl = 'http://api.reittiopas.fi/hsl/prod/';

// For eyecandy
require('colors');

router.route(base)
  .get(function (req, res) {
    res.json([null]);
  });

router.route(base + '/:request/:code')
  .get(function (req, res) {
    util.log(util.format('%s:\tGetting %s for code %s', base, (req.params.request).bold, (req.params.code).bold));

    var response = Q.defer();
    var params = {
      user: req.query.user || process.env.REITTIOPAS_USER,
      pass: req.query.pass || process.env.REITTIOPAS_PASS,
      request: req.params.request,
      code: req.params.code
    };

    if (params.user == null || params.pass == null) {
      res.status(403).json({
        error: {
          message: 'Invalid authentication'
        }
      })
    }

    http.get(apiUrl + '?' + queryString.stringify(params), function (httpResponse) {
      var body = '';

      httpResponse.on('data', function (chunk) {
        body += chunk;
      });

      httpResponse.on('end', function () {
        var data;

        data = {
          requestTime: moment().toISOString()
        };

        try {
          data = _.extend(data, JSON.parse(body));
        }
        catch (ex) {
          response.reject(ex);
        }

        response.resolve(data);
      });
    });

    response.promise.then(function (data) {
      res.json(data);
    }, function (error) {
      res.status(500).json({ error: error });
    });
  });

module.exports = {
  name: name,
  router: router
};
