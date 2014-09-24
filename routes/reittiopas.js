'use strict';

var _ = require('underscore');
var Q = require('q');
var util = require('util');
var http = require('http');
var express = require('express');
var router = express.Router();
var queryString = require('querystring');

require('colors');

var name = 'reittiopas';
var base = '/' + name;

var apiUrl = 'http://api.reittiopas.fi/hsl/prod/';
var auth = { user: '', pass: '' };

router.route(base)
  .get(function (req, res) {
    res.json([null]);
  });

router.route(base + '/:request/:code')
  .get(function (req, res) {
    var request = req.params.request;
    var code = req.params.code;

    console.log('Getting ' + request.bold + ' for code ' + code.bold);

    var param = _.extend({}, auth, { request: request, code: code });
    var response = Q.defer();

    http.get((apiUrl + '?' + queryString.stringify(param)), function (res) {
      var body = '';

      res.on('data', function (chunk) {
        body += chunk;
      });

      res.on('end', function () {
        var data;

        try {
          data = JSON.parse(body);
        }
        catch (e) {
          response.reject(e);
        }

        response.resolve(data);
      });
    });

    response.promise.then(function (data) {
      res.json({ originalResponse: data });
    }, function (e) {
      res.status(500).json({ error: e });
    });
  });

module.exports = {
  name: name,
  router: router
};
