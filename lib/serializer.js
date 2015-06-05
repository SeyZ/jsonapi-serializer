'use strict';
var _ = require('lodash');
var CollectionSerializer = require('./collection-serializer');
var ResourceSerializer = require('./resource-serializer');

module.exports = function (collectionName, data, opts) {
  if (_.isArray(data)) {
    return new CollectionSerializer(collectionName, data, opts);
  } else {
    return new ResourceSerializer(collectionName, data, opts);
  }
};
