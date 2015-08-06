'use strict';
var _ = require('lodash');
var CollectionSerializer = require('./collection-serializer');
var ResourceSerializer = require('./resource-serializer');

module.exports = function (collectionName, records, opts) {
  var payload = {};

  function getLinks(links) {
    return _.mapValues(links, function (value) {
      if (_.isFunction(value)) {
        return value(records);
      } else {
        return value;
      }
    });
  }

  if (opts.topLevelLinks) { payload.links = getLinks(opts.topLevelLinks); }

  if (_.isArray(records)) {
    return new CollectionSerializer(payload, collectionName, records, opts);
  } else {
    return new ResourceSerializer(payload, collectionName, records, opts);
  }

  return payload;
};
