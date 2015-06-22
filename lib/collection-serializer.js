'use strict';
var P = require('bluebird');
var _ = require('lodash');
var SerializerUtils = require('./serializer-utils');

function CollectionSerializer(collectionName, records, opts) {
  var payload = { data: [], included: [] };

  function getLinks(links) {
    return _.mapValues(links, function (value) {
      if (_.isFunction(value)) {
        return value(records);
      } else {
        return value;
      }
    });
  }

  var serializerUtils = new SerializerUtils(collectionName, payload, opts);
  if (opts.links) { payload.links = getLinks(opts.links); }

  records.forEach(function (record) {
    payload.data.push(serializerUtils.perform(record));
  });

  return new P(function (resolve) {
    resolve(payload);
  });
}

module.exports = CollectionSerializer;
