'use strict';

var Q = require('q');
var util = require('util');
var http = require('http');
var express = require('express');
var router = express.Router();
var queryString = require('querystring');

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
    util.log(util.format('Getting %s for code %s', req.params.request.bold, req.params.code.bold));

    var response = Q.defer();
    var params = {
      user: process.env.REITTIOPAS_USER,
      pass: process.env.REITTIOPAS_PASS,
      request: req.params.request,
      code: req.params.code
    };


    http.get(apiUrl + '?' + queryString.stringify(params), function (httpResponse) {
      var body = '';

      httpResponse.on('data', function (chunk) {
        body += chunk;
      });

      httpResponse.on('end', function () {
        var data;

        try {
          data = JSON.parse(body);
        }
        catch (ex) {
          response.reject(ex);
        }

        response.resolve(data);
      });
    });

    response.promise.then(function (data) {
      res.json({ originalResponse: data });
    }, function (error) {
      res.status(500).json({ error: error });
    });
  });

module.exports = {
  name: name,
  router: router
};
