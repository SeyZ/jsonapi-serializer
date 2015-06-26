'use strict';
var P = require('bluebird');
var _ = require('lodash');
var SerializerUtils = require('./serializer-utils');

function CollectionSerializer(collectionName, records, opts) {
  var payload = { data: [] };

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

  records.forEach(function (record) {
    var serializerUtils = new SerializerUtils(collectionName, record, payload,
      opts);
    payload.data.push(serializerUtils.perform());
  });

  return new P(function (resolve) {
    resolve(payload);
  });
}

module.exports = CollectionSerializer;
