'use strict';
var _ = require('lodash');
var P = require('bluebird');
var DeserializerUtils = require('./deserializer-utils');

module.exports = function (opts) {
  if (!opts) { opts = {}; }

  this.deserialize = function (jsonapi, callback) {
    function collection() {
      return P
        .map(jsonapi.data, function (d) {
          return new DeserializerUtils(jsonapi, d, opts).perform();
        })
        .then(function (result) {
          callback(null, result);
        });
    }

    function resource() {
      return new DeserializerUtils(jsonapi, jsonapi.data, opts)
        .perform()
        .then(function (result) {
          callback(null, result);
        });
    }

    if (_.isArray(jsonapi.data)) {
      return collection();
    } else {
      return resource();
    }
  };
};
