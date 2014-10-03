'use strict';

var util = require('util');
var http = require('http');
var express = require('express');
var router = express.Router();
var queryString = require('querystring');
var slugify = require('slugify');
var moment = require('moment');
var $ = require('cheerio');
var _ = require('underscore');

var Q = require('q');

var name = 'posti';
var base = '/' + name;

var apiUrl = 'http://www.posti.fi/itemtracking/posti/search_by_shipment_id';

require('colors');

var targetElem = '#shipment-details-search-result-box';
var rootSel = '#cv-view-box';

// Oh dear...
var timeRe = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4}) klo (\d{1,2})\:(\d{1,2})\:(\d{1,2})$/;

var sel = {
  itemHeader: '.shipment-event-table-header'
};

var detailKeyMap = {
  'lahetystunnus': 'shipmentId',
  'toinen-lahetystunnus': 'shipmentIdSecondary',
  'kuljetuspalvelu': 'service',
  'lisapalvelut': 'additionalServices',
  'paino': 'weight',
  'tilavuus': 'volume',
  'kohdepostinumero': 'destinationZipcode',
  'vastaanottajan-kuittaus': 'recipientSignature',
  'postiennakkosumma': 'cashOnDelivery',
  'ennakkoilmoitus-tekstiviestina': 'notification',
  'sahkoinen-1-saapumisilmoitus': 'noticeOfDeliveryFirst',
  'sahkoinen-2-saapumisilmoitus': 'noticeOfDeliverySecond'
};

var eventKeyMap = {
  'rekisterointi': 'registered',
  'paikka': 'place'
};

router.route(base + '/:shipment_id')
  .get(function (req, res) {
    util.log(util.format('Getting shipment with ID %s', (req.params.shipment_id).bold));

    var response = Q.defer();
    var responseResult = response.promise;

    // URL parameters for request
    var params = {
      lang: 'fi',
      ShipmentId: req.params.shipment_id
    };

    http.get(apiUrl + '?' + queryString.stringify(params), function (httpResponse) {
      var body = '';

      httpResponse.on('data', function (chunk) {
        body += chunk;
      });

      httpResponse.on('error', function () {
        response.reject({ error: arguments });
      });

      httpResponse.on('end', function () {
        var data;
        data = {};

        var root = $(rootSel, body);
        var $shipmentDetails = $('#shipment-details-table', root);
        var $shipmentEvents = $('#shipment-event-table', root);

        var details = {};
        var fields = [];

        // Shipment details and meta
        var $shipmentDetailRows = $('tr', $shipmentDetails);
        $shipmentDetailRows.each(function (i, el) {
          var b = $(el).text().replace(/\n/g, '');
          b = b.split(':');

          // Do we have k:v-pair?
          if (b.length > 1) {
            var key = slugify(b[0].toLowerCase().replace(/\./g, ''));
            var value = b[1];

            if (detailKeyMap[key] != null) {
              details[detailKeyMap[key]] = value;
            }
          }
        });

        var $shipmentEventRows = $('tbody > tr', $shipmentEvents);
        $shipmentEventRows.each(function (i, el) {
          var event = {};

          var $header = $('.shipment-event-table-header', el);
          var $eventRows = $('.shipment-event-table-row', el);

          event.description = $header.text();
          event.events = [];

          $eventRows.each(function (evIdx, evEl) {
            var $label = $('.shipment-event-table-label', evEl).text();
            var $value = $('.shipment-event-table-data', evEl);

            var eObj = {
              event: null,
              value: null
            };

            var k = slugify($label.replace(/\n/g, '').replace(/(:|\.)/g, '').toLowerCase());

            if ($label != '' && k != '') {
              var eventName = eventKeyMap[k];;
              var eventValue = $value.text();

              // Probably the preferred timestamp
              if (eventName === 'registered') {
                var timeObj = eventValue.match(timeRe);
                var dateTimeObj;

                try {
                  dateTimeObj = {
                    day: timeObj[1],
                    month: timeObj[2],
                    year: timeObj[3],
                    hour: timeObj[4],
                    minute: timeObj[5],
                    second: timeObj[6]
                  };

                  var dObj = dateTimeObj;
                  var d = new Date(dObj.year, dObj.month, dObj.day, dObj.hour, dObj.minute, dObj.second);
                  var mo = moment(d);

                  eventValue = mo.toISOString();
                }
                catch (e) {
                  util.log(util.format('\t\tError in parsing date'.red));
                  util.log(e);
                }
              }

              _.extend(eObj, {
                event: eventName,
                value: eventValue
              });

              event.events.push(eObj);
            }
          });

          fields.push(event);
        });

        _.extend(data, { details: details }, { fields: fields });

        response.resolve(data);
      });
    });

    response.promise.then(function (data) {
      res.json(data);
    }, function (e) {
      res.status(500).json(e);
    })
  });

module.exports = {
  name: name,
  router: router
};