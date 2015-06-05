'use strict';
var P = require('bluebird');
var SerializerUtils = require('./serializer-utils');

function CollectionSerializer(collectionName, records, opts) {
  var payload = { links: {}, data: [], included: [] };

  var serializerUtils = new SerializerUtils(collectionName, payload, opts);
  payload.links.self = serializerUtils.apiEndpoint();

  records.forEach(function (record) {
    payload.data.push(serializerUtils.perform(record));
  });

  return new P(function (resolve) {
    resolve(payload);
  });
}

module.exports = CollectionSerializer;
