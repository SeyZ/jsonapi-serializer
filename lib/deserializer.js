'use strict';
var _ = require('lodash');
var DeserializerUtils = require('./deserializer-utils');

module.exports = function (opts) {
  if (!opts) { opts = {}; }

  this.deserialize = function (jsonapi, callback) {
    function collection() {
      return Promise
        .all(jsonapi.data.map(function (d) {
          return new DeserializerUtils(jsonapi, d, opts).perform();
        }))
        .then(function (result) {
          if (_.isFunction(callback)) {
            callback(null, result);
          }

          return result
        });
    }

    function resource() {
      return new DeserializerUtils(jsonapi, jsonapi.data, opts)
        .perform()
        .then(function (result) {
          if (_.isFunction(callback)) {
            callback(null, result);
          }

          return result
        });
    }

    if (_.isArray(jsonapi.data)) {
      return collection();
    } else {
      return resource();
    }
  };
};
