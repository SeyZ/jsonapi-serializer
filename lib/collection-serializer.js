'use strict';
var P = require('bluebird');
var SerializerUtils = require('./serializer-utils');

function CollectionSerializer(collectionName, records, opts) {
  var payload = { data: [], included: [] };

  var serializerUtils = new SerializerUtils(collectionName, payload, opts);
  if (opts.links) { payload.links = opts.links; }

  records.forEach(function (record) {
    payload.data.push(serializerUtils.perform(record));
  });

  return new P(function (resolve) {
    resolve(payload);
  });
}

module.exports = CollectionSerializer;
