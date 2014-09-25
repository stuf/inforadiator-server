'use strict';

var util = require('util');
var http = require('http');
var https = require('https');
var express = require('express');
var router = express.Router();

var Q = require('q');

var name = 'wanikani';
var base = '/' + name;

var apiUrl = 'https://www.wanikani.com/api/user/';

// Candy!
require('colors');

/**
 * TODO: Routing for plain <api_key>, or with <optional_parameter>
 * TODO: Separate request handler from routing
 */

/**
 * GET /wanikani/<api_key>/<resource>
 */
router.route(base + '/:api_key/:resource')
  .get(function (req, res) {
    util.log(util.format('Getting %s for user %s', req.params.resource.bold, req.params.api_key.bold));

    var response = Q.defer();
    var responseResult = response.promise;

    if (req.params.api_key == null) {
      res.status(403).json({
        error: {
          message: 'Invalid authentication'
        }
      })
    }

    var url = apiUrl + req.params.api_key + '/' + req.params.resource;

    https.get(url, function (reqRes) {
      var body = '';

      reqRes.on('data', function (chunk) {
        body += chunk;
      });

      reqRes.on('end', function () {
        var data;

        try {
          data = JSON.parse(body);
        }
        catch (ex) {
          response.reject(ex);
        }

        response.resolve(data);
      })
    });

    var responseSuccess = function (data) {
      res.json(data);
    };

    var responseFailure = function (error) {
      res.status(500).json(error);
    };

    responseResult.then(responseSuccess, responseFailure);
  });

module.exports = {
  name: name,
  router: router
};
