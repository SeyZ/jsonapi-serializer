"use strict";
var isFunction = require("lodash/isFunction");
var DeserializerUtils = require("./deserializer-utils");

module.exports = function(opts) {
  if (!opts) {
    opts = {};
  }

  this.deserialize = function(jsonapi, callback) {
    return new DeserializerUtils(jsonapi, jsonapi.data, opts)
      .perform()
      .then(function(result) {
        if (isFunction(callback)) {
          callback(null, result);
        }
        return result;
      });
  };
};
